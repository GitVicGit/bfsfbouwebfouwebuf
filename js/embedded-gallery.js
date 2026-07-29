(() => {
    const galleries = document.querySelectorAll("[data-embedded-gallery]");

    galleries.forEach((gallery) => {
        const mainImage = gallery.querySelector("[data-embedded-main]");
        const links = Array.from(gallery.querySelectorAll("[data-embedded-image]"));
        const counter = gallery.querySelector("[data-embedded-counter]");
        const viewer = gallery.querySelector(".embedded-artwork-viewer");
        const stage = gallery.querySelector(".embedded-artwork-viewer__stage");
        const counterOf = gallery.dataset.counterOf || "of";
        let currentIndex = Math.max(0, links.findIndex((link) => link.getAttribute("aria-current") === "true"));

        if (!mainImage || !links.length || !viewer || !stage) return;

        function fittedScale(width, height, availableWidth, availableHeight) {
            if (!width || !height || availableWidth <= 0 || availableHeight <= 0) return 0;
            return Math.min(availableWidth / width, availableHeight / height);
        }

        function updateLayout(link) {
            const width = Number.parseFloat(link.dataset.galleryWidth);
            const height = Number.parseFloat(link.dataset.galleryHeight);
            const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

            if (window.innerWidth <= 64 * rootFontSize) {
                viewer.classList.add("embedded-artwork-viewer--stacked");
                return;
            }

            const gap = Number.parseFloat(getComputedStyle(viewer).columnGap) || 0;
            const thumbnailWidth = links[0].getBoundingClientRect().width || 5 * rootFontSize;
            const stageHeight = stage.getBoundingClientRect().height;
            const sideScale = fittedScale(width, height, viewer.clientWidth - thumbnailWidth - gap, stageHeight);
            const stackedScale = fittedScale(width, height, viewer.clientWidth, stageHeight);

            viewer.classList.toggle("embedded-artwork-viewer--stacked", stackedScale > sideScale * 1.01);
        }

        function selectImage(link, index) {
            const srcset = link.dataset.gallerySrcset;
            const sizes = link.dataset.gallerySizes;

            currentIndex = index;
            mainImage.removeAttribute("srcset");
            mainImage.removeAttribute("sizes");
            mainImage.setAttribute("width", link.dataset.galleryWidth);
            mainImage.setAttribute("height", link.dataset.galleryHeight);
            mainImage.alt = link.dataset.galleryAlt || "";

            if (srcset) mainImage.srcset = srcset;
            if (sizes) mainImage.sizes = sizes;
            mainImage.src = link.getAttribute("href");

            links.forEach((candidate, candidateIndex) => {
                candidate.setAttribute("aria-current", candidateIndex === index ? "true" : "false");
            });

            if (counter) counter.textContent = `${index + 1} ${counterOf} ${links.length}`;
            updateLayout(link);
        }

        links.forEach((link, index) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                selectImage(link, index);
            });
        });

        updateLayout(links[currentIndex]);
        window.addEventListener("resize", () => updateLayout(links[currentIndex]));
    });
})();
