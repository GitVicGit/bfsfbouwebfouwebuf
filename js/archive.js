(() => {
    const grid = document.querySelector("#work-grid");
    const filters = document.querySelector(".archive-filters");
    const archivePage = document.querySelector(".archive-page");

    if (!grid || !filters || !archivePage) return;

    const buttons = Array.from(filters.querySelectorAll("button[data-filter]"));
    const works = Array.from(grid.querySelectorAll(".work-item"));
    const seriesIntroductions = Array.from(
        document.querySelectorAll("[data-series-introduction]")
    );
    const languageSwitch = document.querySelector(".lang-switch");
    const loadingIndicator = document.querySelector(
        ".archive-loading-indicator"
    );

    const validFilters = new Set([
        "all",
        ...buttons
            .map((button) => button.dataset.filter)
            .filter(Boolean)
    ]);

    const paintingOrder2025 = new Map([
        ["Genesis of Steel III", 10],
        ["Genesis of Steel I", 20],
        ["Genesis of Steel II", 30],
        ["Topography of a Meditation I", 40],
        ["Topography of a Meditation II", 50],
        ["Verdant Vistas I to IV", 60],
        ["Genèse de l’acier III", 10],
        ["Genèse de l’acier I", 20],
        ["Genèse de l’acier II", 30],
        ["Topographie d’une Méditation I", 40],
        ["Topographie d’une Méditation II", 50]
    ]);

    const minimumLoadingTime = 180;
    const maximumAssetWait = 3500;

    let activeFilter = null;
    let operationId = 0;
    let resizeFrame = 0;
    let resizeTimer = 0;

    function nextFrame() {
        return new Promise((resolve) => requestAnimationFrame(resolve));
    }

    function delay(milliseconds) {
        return new Promise((resolve) => {
            window.setTimeout(resolve, milliseconds);
        });
    }

    function workYear(work) {
        const year = Array.from(
            work.querySelectorAll(".artwork-description p")
        )
            .map((paragraph) => paragraph.textContent.trim())
            .find((value) => /^(?:19|20)\d{2}$/.test(value));

        return Number.parseInt(year, 10) || 0;
    }

    const workRecords = works.map((work, index) => ({
        work,
        index,
        year: workYear(work),
        title:
            work
                .querySelector("img:not([data-lightbox-only])")
                ?.alt.trim() || ""
    }));

    function orderWorks(selected) {
        workRecords
            .slice()
            .sort((left, right) => {
                const yearDifference = right.year - left.year;
                if (yearDifference) return yearDifference;

                if (selected === "painting" && left.year === 2025) {
                    const leftOrder =
                        paintingOrder2025.get(left.title) || 1000;
                    const rightOrder =
                        paintingOrder2025.get(right.title) || 1000;

                    if (leftOrder !== rightOrder) {
                        return leftOrder - rightOrder;
                    }
                }

                return left.index - right.index;
            })
            .forEach(({ work }) => {
                grid.append(work);
            });
    }

    function visibleWorks() {
        return works.filter((work) => !work.hidden);
    }

    function visiblePrimaryImages(currentWorks) {
        return currentWorks
            .map((work) =>
                work.querySelector(
                    "img:not([data-lightbox-only])"
                )
            )
            .filter(Boolean);
    }

    function columnCount() {
        const columns = getComputedStyle(grid).gridTemplateColumns;
        return Math.max(1, columns.split(" ").filter(Boolean).length);
    }

    function imagesNeededBeforeReveal(images) {
        /*
         * Small series load completely. Larger archive views wait for
         * two rows only. Every image already has width and height
         * attributes, so later lazy loads cannot alter card geometry.
         */
        if (images.length <= 12) return images;

        return images.slice(
            0,
            Math.min(images.length, columnCount() * 2)
        );
    }

    function markImageReady(image) {
        image.classList.add("is-image-ready");
    }

    async function settleImage(image) {
        if (image.complete) {
            try {
                if (typeof image.decode === "function") {
                    await image.decode();
                }
            } catch {
                /*
                 * A failed image must not leave the archive loading
                 * indefinitely. Its declared dimensions still reserve
                 * the correct layout space.
                 */
            }

            markImageReady(image);
            return;
        }

        await new Promise((resolve) => {
            const finish = () => {
                image.removeEventListener("load", finish);
                image.removeEventListener("error", finish);
                resolve();
            };

            image.addEventListener("load", finish, { once: true });
            image.addEventListener("error", finish, { once: true });
        });

        try {
            if (typeof image.decode === "function") {
                await image.decode();
            }
        } catch {
            // Loading or decoding failure is non-fatal.
        }

        markImageReady(image);
    }

    async function waitForAssets(currentWorks, includeFonts) {
        const images = visiblePrimaryImages(currentWorks);
        const priorityImages = imagesNeededBeforeReveal(images);

        priorityImages.forEach((image, index) => {
            image.loading = "eager";

            if (index === 0) {
                image.setAttribute("fetchpriority", "high");
            }
        });

        const fontReadiness =
            includeFonts && document.fonts
                ? Promise.resolve(document.fonts.ready).catch(
                    () => undefined
                )
                : Promise.resolve();

        await Promise.race([
            Promise.all([
                fontReadiness,
                Promise.all(priorityImages.map(settleImage))
            ]),
            delay(maximumAssetWait)
        ]);
    }

    function setLoading(isLoading) {
        archivePage.classList.toggle("is-loading", isLoading);
        archivePage.setAttribute("aria-busy", String(isLoading));
        grid.setAttribute("aria-busy", String(isLoading));

        if (loadingIndicator) {
            loadingIndicator.setAttribute(
                "aria-hidden",
                String(!isLoading)
            );
        }
    }

    function alignNearlyLevelDescriptions(currentWorks) {
        const descriptions = currentWorks
            .map((work) =>
                work.querySelector(".artwork-description")
            )
            .filter(Boolean);

        descriptions.forEach((description) => {
            description.style.removeProperty(
                "--description-align-offset"
            );
        });

        if (columnCount() < 2 || !descriptions.length) return;

        const lineHeight =
            Number.parseFloat(
                getComputedStyle(descriptions[0]).lineHeight
            ) || 0;
        const maximumCorrection = lineHeight * 0.75;

        const sorted = descriptions
            .map((description) => ({
                description,
                top: description.getBoundingClientRect().top
            }))
            .sort((left, right) => left.top - right.top);

        function alignGroup(items) {
            if (items.length < 2) return;

            const targetTop = Math.max(
                ...items.map((item) => item.top)
            );

            items.forEach(({ description, top }) => {
                const correction = targetTop - top;

                if (
                    correction > 1
                    && correction <= maximumCorrection
                ) {
                    description.style.setProperty(
                        "--description-align-offset",
                        `${correction}px`
                    );
                }
            });
        }

        let group = [];

        sorted.forEach((item) => {
            if (
                !group.length
                || item.top - group[0].top <= maximumCorrection
            ) {
                group.push(item);
                return;
            }

            alignGroup(group);
            group = [item];
        });

        alignGroup(group);
    }

    function setMasonrySpans(currentWorks) {
        currentWorks.forEach((work) => {
            const spacing =
                Number.parseFloat(
                    getComputedStyle(work).marginBottom
                ) || 0;

            /*
             * Do not reset gridRowEnd to "auto". That was the source
             * of the visible up-and-down jump between animation frames.
             * scrollHeight reports the intrinsic card height while the
             * existing span remains in place.
             */
            work.style.gridRowEnd =
                `span ${Math.ceil(work.scrollHeight + spacing)}`;
        });
    }

    async function layoutWorks(currentWorks) {
        await nextFrame();

        setMasonrySpans(currentWorks);
        grid.classList.remove("is-measuring");
        grid.classList.add("is-masonry");

        await nextFrame();

        alignNearlyLevelDescriptions(currentWorks);
        setMasonrySpans(currentWorks);

        await nextFrame();
    }

    function syncLanguageSwitch() {
        if (!languageSwitch) return;

        try {
            const target = new URL(
                languageSwitch.getAttribute("href"),
                location.href
            );

            target.hash = location.hash;
            languageSwitch.href =
                `${target.pathname}${target.search}${target.hash}`;
        } catch {
            // Language-link failure must not disable filtering.
        }
    }

    function updateAddress(selected) {
        try {
            const url =
                selected === "all"
                    ? location.pathname
                    : `#${selected}`;

            history.replaceState(null, "", url);
        } catch {
            // Filtering still works without the History API.
        }
    }

    function updateVisibleContent(selected) {
        orderWorks(selected);

        works.forEach((work) => {
            const matchesMedium =
                work.dataset.medium === selected;
            const matchesSeries =
                selected.startsWith("series-")
                && work.dataset.series
                    === selected.slice("series-".length);

            work.hidden =
                selected !== "all"
                && !matchesMedium
                && !matchesSeries;
        });

        buttons.forEach((button) => {
            button.setAttribute(
                "aria-pressed",
                String(button.dataset.filter === selected)
            );
        });

        seriesIntroductions.forEach((introduction) => {
            introduction.hidden =
                selected
                !== `series-${
                    introduction.dataset.seriesIntroduction
                }`;
        });

        archivePage.classList.toggle(
            "has-series-introduction",
            seriesIntroductions.some(
                (introduction) => !introduction.hidden
            )
        );
    }

    async function applyFilter(
        filter,
        updateUrl = true,
        force = false
    ) {
        const selected = validFilters.has(filter)
            ? filter
            : "all";

        if (
            !force
            && selected === activeFilter
            && grid.classList.contains("is-layout-ready")
        ) {
            return;
        }

        activeFilter = selected;
        const currentOperation = ++operationId;
        const startedAt = performance.now();

        setLoading(true);
        grid.classList.remove("is-layout-ready");

        updateVisibleContent(selected);

        if (updateUrl) updateAddress(selected);
        syncLanguageSwitch();

        const currentWorks = visibleWorks();

        try {
            await waitForAssets(
                currentWorks,
                !document.documentElement.classList.contains(
                    "archive-ready"
                )
            );

            if (currentOperation !== operationId) return;

            await layoutWorks(currentWorks);

            if (currentOperation !== operationId) return;

            const elapsed = performance.now() - startedAt;
            if (elapsed < minimumLoadingTime) {
                await delay(minimumLoadingTime - elapsed);
            }

            if (currentOperation !== operationId) return;

            grid.classList.add("is-layout-ready");
            document.documentElement.classList.add("archive-ready");
            document.documentElement.classList.remove(
                "archive-reveal-fallback"
            );
            setLoading(false);
        } catch (error) {
            console.error("Works archive layout failed", error);
            grid.classList.add("is-layout-ready");
            document.documentElement.classList.add("archive-ready");
            setLoading(false);
        }
    }

    async function applyLocationHash() {
        const hash = location.hash.slice(1);
        const linkedWork = hash
            ? document.getElementById(hash)
            : null;

        if (
            linkedWork
            && linkedWork.classList.contains("work-item")
        ) {
            await applyFilter(
                linkedWork.dataset.medium || "all",
                false,
                true
            );

            linkedWork.scrollIntoView({ block: "start" });
            return;
        }

        await applyFilter(
            validFilters.has(hash) ? hash : "all",
            false,
            true
        );
    }

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            applyFilter(button.dataset.filter || "all");
        });
    });

    filters.hidden = false;
    grid.classList.add("is-measuring");
    setLoading(true);

    /*
     * Images outside the initial reveal set remain lazy-loaded. Their
     * intrinsic width and height attributes reserve their space, so no
     * masonry recalculation is needed when they finish loading.
     */
    grid.querySelectorAll(
        "img:not([data-lightbox-only])"
    ).forEach((image) => {
        if (image.complete) markImageReady(image);
        else {
            image.addEventListener(
                "load",
                () => markImageReady(image),
                { once: true }
            );
            image.addEventListener(
                "error",
                () => markImageReady(image),
                { once: true }
            );
        }
    });

    window.addEventListener("hashchange", applyLocationHash);

    window.addEventListener("resize", () => {
        window.clearTimeout(resizeTimer);

        resizeTimer = window.setTimeout(() => {
            cancelAnimationFrame(resizeFrame);

            resizeFrame = requestAnimationFrame(() => {
                const currentWorks = visibleWorks();
                alignNearlyLevelDescriptions(currentWorks);
                setMasonrySpans(currentWorks);
            });
        }, 120);
    });

    applyLocationHash();
})();