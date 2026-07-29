(() => {
    const gallery = document.querySelector("[data-lightbox-gallery]");
    if (!gallery || typeof HTMLDialogElement === "undefined") return;

    const images = Array.from(gallery.querySelectorAll("img")).filter((image) => !image.closest("a"));
    if (!images.length) return;

    const isFrench = document.documentElement.lang === "fr";
    const labels = isFrench
        ? {
            close: "Fermer",
            previous: "Image précédente",
            next: "Image suivante",
            image: "Image",
            of: "sur",
            further: "Autres vues",
            view: "Voir l’image",
            previousWork: "Œuvre précédente",
            nextWork: "Œuvre suivante",
            series: "Voir toutes les œuvres de la série",
            seriesNavigation: "Navigation dans la série"
        }
        : {
            close: "Close",
            previous: "Previous image",
            next: "Next image",
            image: "Image",
            of: "of",
            further: "Further images",
            view: "View image",
            previousWork: "Previous work",
            nextWork: "Next work",
            series: "See all works in the series",
            seriesNavigation: "Series navigation"
        };

    const dialog = document.createElement("dialog");
    dialog.className = "artwork-lightbox";
    dialog.setAttribute("aria-label", isFrench ? "Visionneuse d’œuvres" : "Artwork viewer");
    dialog.tabIndex = -1;

    const scroller = document.createElement("div");
    scroller.className = "artwork-lightbox__scroller";

    const stage = document.createElement("figure");
    stage.className = "artwork-lightbox__stage";

    const fullImage = document.createElement("img");
    fullImage.className = "artwork-lightbox__image";
    fullImage.alt = "";
    stage.append(fullImage);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "artwork-lightbox__close";
    closeButton.setAttribute("aria-label", labels.close);

    const previousButton = document.createElement("button");
    previousButton.type = "button";
    previousButton.className = "artwork-lightbox__previous";
    previousButton.setAttribute("aria-label", labels.previous);

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "artwork-lightbox__next";
    nextButton.setAttribute("aria-label", labels.next);

    const information = document.createElement("section");
    information.className = "artwork-lightbox__information";

    const details = document.createElement("div");
    details.className = "artwork-lightbox__details";

    const title = document.createElement("h2");
    title.className = "artwork-lightbox__title";

    const metadata = document.createElement("div");
    metadata.className = "artwork-lightbox__metadata";

    const seriesNavigation = document.createElement("nav");
    seriesNavigation.className = "artwork-lightbox__series-navigation";
    seriesNavigation.setAttribute("aria-label", labels.seriesNavigation);

    const previousWorkButton = document.createElement("button");
    previousWorkButton.type = "button";
    previousWorkButton.className = "artwork-lightbox__series-previous";
    previousWorkButton.textContent = `← ${labels.previousWork}`;

    const seriesLink = document.createElement("a");
    seriesLink.className = "artwork-lightbox__series-link";

    const nextWorkButton = document.createElement("button");
    nextWorkButton.type = "button";
    nextWorkButton.className = "artwork-lightbox__series-next";
    nextWorkButton.textContent = `${labels.nextWork} →`;

    seriesNavigation.append(previousWorkButton, seriesLink, nextWorkButton);

    const counter = document.createElement("p");
    counter.className = "artwork-lightbox__counter";
    counter.setAttribute("aria-live", "polite");

    details.append(title, metadata);

    const further = document.createElement("div");
    further.className = "artwork-lightbox__further";

    const thumbnails = document.createElement("div");
    thumbnails.className = "artwork-lightbox__thumbnails";
    thumbnails.setAttribute("role", "group");
    thumbnails.setAttribute("aria-label", labels.further);

    further.append(thumbnails, counter);
    information.append(details, further, seriesNavigation);
    scroller.append(stage, information);
    dialog.append(closeButton, previousButton, nextButton, scroller);
    document.body.append(dialog);

    let currentIndex = 0;
    let currentItems = [];
    let thumbnailButtons = [];
    let lastTrigger = null;
    let currentSeriesWorks = [];
    let currentSeriesWorkIndex = -1;

    const pageIsSingleProject = gallery.matches(".project-page, .portfolio-page");

    function imageDimensions(image) {
        const width = Number.parseFloat(image.getAttribute("width")) || image.naturalWidth;
        const height = Number.parseFloat(image.getAttribute("height")) || image.naturalHeight;
        return { width, height };
    }

    function isPortrait(image) {
        const { width, height } = imageDimensions(image);
        return Boolean(width && height && height / width > 1.08);
    }

    function clamp(minimum, preferred, maximum) {
        return Math.min(maximum, Math.max(minimum, preferred));
    }

    function fittedScale(width, height, availableWidth, availableHeight) {
        if (!width || !height || availableWidth <= 0 || availableHeight <= 0) return 0;
        return Math.min(availableWidth / width, availableHeight / height);
    }

    function shouldStackPortrait(image) {
        const { width, height } = imageDimensions(image);
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

        if (viewportWidth <= 44 * rootFontSize) return true;

        const sidePadding = clamp(5 * rootFontSize, viewportWidth * 0.08, 8 * rootFontSize);
        const informationWidth = clamp(
            26 * rootFontSize,
            viewportWidth * 0.38,
            48 * rootFontSize
        );
        const sideScale = fittedScale(
            width,
            height,
            viewportWidth - informationWidth - (2 * sidePadding),
            viewportHeight - (2 * sidePadding)
        );

        const stackedPadding = clamp(4 * rootFontSize, viewportWidth * 0.08, 8 * rootFontSize);
        const stackedHeightRatio = viewportWidth <= 64 * rootFontSize ? 0.65 : 0.72;
        const stackedScale = fittedScale(
            width,
            height,
            viewportWidth - (2 * stackedPadding),
            viewportHeight * stackedHeightRatio
        );

        return stackedScale > sideScale * 1.04;
    }

    function updateLayout(item) {
        const portrait = isPortrait(item.image);
        dialog.classList.toggle("artwork-lightbox--portrait", portrait);
        dialog.classList.toggle("artwork-lightbox--landscape", !portrait);
        dialog.classList.toggle("artwork-lightbox--portrait-stacked", portrait && shouldStackPortrait(item.image));
    }

    function readDetails(image) {
        const card = image.closest(".work-item, .exhibition-item");
        const description = card?.querySelector(".artwork-description");
        const paragraphs = description ? Array.from(description.querySelectorAll(":scope > p")) : [];
        const projectTitle = gallery.querySelector(".project-heading h1")?.textContent.trim();
        const projectFacts = pageIsSingleProject
            ? Array.from(gallery.querySelectorAll(".project-facts dd"), (fact) => fact.textContent.trim()).filter(Boolean)
            : [];
        const figureCaption = image.closest("figure")?.querySelector("figcaption")?.textContent.trim();

        return {
            title: paragraphs[0]?.textContent.trim() || projectTitle || figureCaption || image.alt || labels.image,
            lines: paragraphs.length > 1
                ? paragraphs.slice(1).map((paragraph) => paragraph.textContent.trim()).filter(Boolean)
                : projectFacts
        };
    }

    const items = images.map((image) => {
        const card = image.closest(".work-item, .exhibition-item");
        const item = {
            image,
            card,
            trigger: null,
            description: image.alt || labels.image,
            group: image.dataset.lightboxGroup || null,
            series: card?.dataset.series || null,
            details: readDetails(image)
        };
        if (image.hasAttribute("data-lightbox-only")) return item;

        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "lightbox-trigger";
        trigger.setAttribute("aria-label", isFrench ? `Agrandir : ${item.description}` : `Enlarge: ${item.description}`);
        image.before(trigger);
        trigger.append(image);
        trigger.addEventListener("click", () => open(item, trigger));
        item.trigger = trigger;
        return item;
    });

    function renderSeriesNavigation(item) {
        const series = item.series;
        if (!series || pageIsSingleProject) {
            seriesNavigation.hidden = true;
            dialog.classList.remove("artwork-lightbox--has-series-navigation");
            currentSeriesWorks = [];
            currentSeriesWorkIndex = -1;
            return;
        }

        const archivePath = isFrench ? "/fr/oeuvres/" : "/selected-works/";

        currentSeriesWorks = items.filter((candidate) => (
            candidate.trigger
            && candidate.series === series
            && candidate.card?.dataset.medium !== "installation"
        ));
        currentSeriesWorkIndex = currentSeriesWorks.findIndex((candidate) => candidate.card === item.card);

        seriesLink.href = `${archivePath}#series-${series}`;
        seriesLink.textContent = labels.series;

        const hasSiblingWorks = currentSeriesWorkIndex >= 0 && currentSeriesWorks.length > 1;
        previousWorkButton.hidden = !hasSiblingWorks;
        nextWorkButton.hidden = !hasSiblingWorks;
        seriesNavigation.hidden = false;
        dialog.classList.add("artwork-lightbox--has-series-navigation");
    }

    function render() {
        const item = currentItems[currentIndex];
        const srcset = item.image.getAttribute("srcset");

        updateLayout(item);

        fullImage.removeAttribute("srcset");
        fullImage.removeAttribute("sizes");
        fullImage.src = item.image.getAttribute("src");
        if (srcset) {
            fullImage.srcset = srcset;
            fullImage.sizes = "(max-width: 40rem) calc(100vw - 3rem), 72vw";
        }
        fullImage.alt = item.description;

        title.textContent = item.details.title;

        metadata.replaceChildren(...item.details.lines.map((line) => {
            const paragraph = document.createElement("p");
            paragraph.textContent = line;
            return paragraph;
        }));
        renderSeriesNavigation(item);

        const hasMultipleImages = currentItems.length > 1;
        counter.textContent = hasMultipleImages ? `${currentIndex + 1} ${labels.of} ${currentItems.length}` : "";
        counter.hidden = !hasMultipleImages;
        previousButton.hidden = !hasMultipleImages;
        nextButton.hidden = !hasMultipleImages;
        further.hidden = !hasMultipleImages;

        thumbnailButtons.forEach((button, index) => {
            const isCurrent = index === currentIndex;
            button.setAttribute("aria-current", isCurrent ? "true" : "false");
            button.setAttribute("aria-label", `${labels.view} ${index + 1}${isCurrent ? `, ${isFrench ? "sélectionnée" : "selected"}` : ""}`);
        });
    }

    function buildThumbnails() {
        thumbnailButtons = currentItems.map((item, index) => {
            const button = document.createElement("button");
            button.type = "button";

            const image = document.createElement("img");
            image.src = item.image.currentSrc || item.image.getAttribute("src");
            image.alt = "";
            image.loading = "lazy";
            image.decoding = "async";

            button.append(image);
            button.addEventListener("click", () => {
                currentIndex = index;
                render();
                scroller.scrollTop = 0;
            });
            return button;
        });
        thumbnails.replaceChildren(...thumbnailButtons);
    }

    function open(item, trigger) {
        currentItems = item.group
            ? items.filter((candidate) => candidate.group === item.group)
            : pageIsSingleProject
                ? items.filter((candidate) => candidate.trigger)
                : [item];
        currentIndex = currentItems.indexOf(item);
        lastTrigger = trigger;
        buildThumbnails();
        render();
        scroller.scrollTop = 0;
        dialog.showModal();
        dialog.focus();
    }

    function openSeriesWork(step) {
        if (currentSeriesWorkIndex < 0 || currentSeriesWorks.length < 2) return;

        const nextIndex = (
            currentSeriesWorkIndex + step + currentSeriesWorks.length
        ) % currentSeriesWorks.length;
        const nextItem = currentSeriesWorks[nextIndex];

        currentItems = nextItem.group
            ? items.filter((candidate) => candidate.group === nextItem.group)
            : [nextItem];
        currentIndex = currentItems.indexOf(nextItem);
        buildThumbnails();
        render();
        scroller.scrollTop = 0;
    }

    function move(step) {
        currentIndex = (currentIndex + step + currentItems.length) % currentItems.length;
        render();
        scroller.scrollTop = 0;
    }

    closeButton.addEventListener("click", () => dialog.close());
    previousButton.addEventListener("click", () => move(-1));
    nextButton.addEventListener("click", () => move(1));
    previousWorkButton.addEventListener("click", () => openSeriesWork(-1));
    nextWorkButton.addEventListener("click", () => openSeriesWork(1));
    seriesLink.addEventListener("click", () => dialog.close());
    dialog.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft" && currentItems.length > 1) move(-1);
        if (event.key === "ArrowRight" && currentItems.length > 1) move(1);
        if (event.key === "Escape") {
            event.preventDefault();
            dialog.close();
        }
    });
    dialog.addEventListener("close", () => lastTrigger?.focus());
    window.addEventListener("resize", () => {
        if (dialog.open && currentItems[currentIndex]) updateLayout(currentItems[currentIndex]);
    });
})();
