(() => {
    const grid = document.querySelector("#work-grid");
    const filters = document.querySelector(".archive-filters");
    const archivePage = document.querySelector(".archive-page");

    if (!grid || !filters || !archivePage) return;

    const buttons = Array.from(
        filters.querySelectorAll("button[data-filter]")
    );
    const works = Array.from(grid.querySelectorAll(".work-item"));
    const seriesIntroductions = Array.from(
        document.querySelectorAll("[data-series-introduction]")
    );
    const languageSwitch = document.querySelector(".lang-switch");
    const loadingIndicator = document.querySelector(
        ".archive-loading-indicator"
    );
    const sculptureSeriesGrid = document.querySelector(
        "#sculpture-series-grid"
    );
    const isFrench = document.documentElement.lang === "fr";

    const validFilters = new Set(
        buttons
            .map((button) => button.dataset.filter)
            .filter(Boolean)
    );
    const defaultFilter = buttons.find(
        (button) => button.dataset.filter === "sculpture"
    )?.dataset.filter || buttons[0]?.dataset.filter || "sculpture";

    const paintingOrder = new Map([
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
        ["Topographie d’une Méditation II", 50],
        ["Nature’s Chromatic Symphony", 10],
        ["Symphonie Chromatique de la Nature", 10],
        ["Power of the Relics", 20],
        ["Pouvoir des Reliques", 20],
        ["Learn with me because I won't last for ever", 30],
        ["Apprends avec moi car je ne durerai pas éternellement", 30],
        ["Symphonie", 40]
    ]);

    const depositOrder = new Map([
        ["Deposit GR", 10],
        ["Deposit RP", 20],
        ["Deposit GG", 30],
        ["Deposit BG", 40],
        ["Deposit RG", 50],
        ["Deposit WR", 60],
        ["Deposit BY", 70],
        ["Deposit BR", 80],
        ["Deposit BB", 90],
        ["Deposit WG", 100]
    ]);

    const ephemeralOrder = new Map([
        ["Tours et Détours", 10],
        ["Scottish Fantasy", 20],
        ["Euryale", 30],
        ["L’Envers des Tours", 40],
        ["La Grande Bocca", 50],
        ["Tours Détourés", 60],
        ["Impasse", 70]
    ]);

    const echoesOrder = new Map([
        ["Echoes of Extraction", 10],
        ["Spinal Bloom", 20],
        ["Spinal Bloom (Éclosion d’Échine)", 20],
        ["Fragile Beauty", 30],
        ["Acanthus Ascendant", 40],
        ["Acanthus Ascendant (Ascension d’Acanthe)", 40],
        ["Été Indien", 50],
        ["Fractal Forest", 60]
    ]);

    const cracksOrder = new Map([
        ["Cracks of Potential", 10],
        ["Liminal", 20],
        ["Présences latentes (Lingering Presences)", 30],
        ["Présences latentes", 30],
        ["Fossil whispers", 40],
        ["Murmures fossiles", 40],
        ["Rien ne se perd (Nothing is lost)", 50],
        ["Rien ne se perd", 50],
        ["Neumünster's Scholar's Rock", 60],
        ["Pierre de lettré de Neumünster", 60],
        ["Rien ne se crée (Nothing is created)", 70],
        ["Rien ne se crée", 70]
    ]);

    const cracksLayoutPositions = new Map([
        ["Cracks of Potential", "cracks-main"],
        ["Liminal", "cracks-liminal"],
        ["Présences latentes (Lingering Presences)", "cracks-presences"],
        ["Présences latentes", "cracks-presences"],
        ["Fossil whispers", "cracks-fossil"],
        ["Murmures fossiles", "cracks-fossil"],
        ["Rien ne se perd (Nothing is lost)", "cracks-lost"],
        ["Rien ne se perd", "cracks-lost"],
        ["Neumünster's Scholar's Rock", "cracks-scholar"],
        ["Pierre de lettré de Neumünster", "cracks-scholar"],
        ["Rien ne se crée (Nothing is created)", "cracks-created"],
        ["Rien ne se crée", "cracks-created"]
    ]);

    const filterOrders = new Map([
        ["painting", paintingOrder],
        ["series-deposit", depositOrder],
        ["series-cracks-of-potential", cracksOrder],
        ["series-echoes-of-extraction", echoesOrder],
        ["series-ephemeral-structures", ephemeralOrder]
    ]);

    const filterLayoutSpans = new Map([
        [
            "painting",
            new Map([
                ["Topography of a Meditation I", 6],
                ["Topography of a Meditation II", 6],
                ["Topographie d’une Méditation I", 6],
                ["Topographie d’une Méditation II", 6],
                ["Verdant Vistas I to IV", 12],
                ["Été Indien", 6],
                ["Fractal Forest", 6],
                ["Nature’s Chromatic Symphony", 6],
                ["Symphonie Chromatique de la Nature", 6],
                ["Power of the Relics", 6],
                ["Pouvoir des Reliques", 6],
                ["Learn with me because I won't last for ever", 6],
                ["Apprends avec moi car je ne durerai pas éternellement", 6],
                ["Symphonie", 6]
            ])
        ],
        [
            "series-echoes-of-extraction",
            new Map([
                ["Echoes of Extraction", 12],
                ["Été Indien", 6],
                ["Fractal Forest", 6]
            ])
        ],
        [
            "series-cracks-of-potential",
            new Map([
                ["Cracks of Potential", 8],
                ["Liminal", 8],
                ["Présences latentes (Lingering Presences)", 8],
                ["Présences latentes", 8]
            ])
        ],
        [
            "series-ephemeral-structures",
            new Map([
                ["Scottish Fantasy", 3],
                ["Euryale", 3],
                ["Tours et Détours", 3],
                ["L’Envers des Tours", 6],
                ["La Grande Bocca", 6],
                ["Tours Détourés", 3],
                ["Impasse", 3]
            ])
        ]
    ]);

    const sculptureChapters = [
        {
            series: "deposit",
            title: "Deposit",
            href: "#series-deposit",
            representative: "Deposit RG"
        },
        {
            series: "loudspeaker",
            title: "Loud Speaker",
            href: isFrench ? "/fr/loudspeaker/" : "/loudspeaker/",
            representative: "Loud Speaker"
        },
        {
            series: "cracks-of-potential",
            title: "Cracks of Potential",
            href: "#series-cracks-of-potential",
            representative: "Cracks of Potential"
        },
        {
            series: "echoes-of-extraction",
            title: "Echoes of Extraction",
            href: "#series-echoes-of-extraction",
            representative: "Echoes of Extraction"
        },
        {
            series: "antidote",
            title: "Antidote",
            href: "#series-antidote",
            representative: "Tri-Hex"
        },
        {
            series: "ephemeral-structures",
            title: "Ephemeral Structures",
            href: "#series-ephemeral-structures",
            representative: "L’Envers des Tours"
        },
        {
            series: "vase",
            title: "Vase",
            href: "#series-vase",
            representative: "Triton"
        },
    ];

    const minimumLoadingTime = 120;
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

    function imageRecord(image) {
        return {
            src: image.getAttribute("src") || "",
            srcset: image.getAttribute("srcset") || "",
            sizes: image.getAttribute("sizes") || "",
            width: image.getAttribute("width") || "",
            height: image.getAttribute("height") || ""
        };
    }

    function chapterImageRecord(title) {
        const work = works.find((item) =>
            item.querySelector(".artwork-description strong")
                ?.textContent.trim() === title
        );
        const image = work?.querySelector(
            "img:not([data-lightbox-only])"
        );

        return image ? imageRecord(image) : null;
    }

    function setChapterImage(image, record) {
        image.src = record.src;

        ["srcset", "sizes", "width", "height"].forEach((attribute) => {
            const value = record[attribute];
            if (value) {
                image.setAttribute(attribute, value);
            } else {
                image.removeAttribute(attribute);
            }
        });
    }

    function buildSculptureSeriesGrid() {
        if (!sculptureSeriesGrid) return;

        sculptureChapters.forEach((chapter) => {
            const representative = chapterImageRecord(
                chapter.representative
            );
            const link = document.createElement("a");
            const stage = document.createElement("span");
            const image = document.createElement("img");
            const title = document.createElement("span");

            link.className = "sculpture-series-card";
            link.href = chapter.href;
            link.dataset.series = chapter.series;
            stage.className = "sculpture-series-card__stage";
            title.className = "sculpture-series-card__title";
            title.textContent = chapter.title;
            image.alt = "";
            image.loading = "lazy";
            image.decoding = "async";

            if (representative) setChapterImage(image, representative);

            stage.append(image);
            link.append(stage, title);
            sculptureSeriesGrid.append(link);
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
                ?.alt.trim() || "",
        selectionTitle:
            work
                .querySelector(".artwork-description strong")
                ?.textContent.trim() || ""
    }));

    function orderWorks(selected) {
        workRecords
            .slice()
            .sort((left, right) => {
                const selectedOrder = filterOrders.get(selected);

                if (
                    selected === "series-ephemeral-structures"
                    && selectedOrder
                ) {
                    const leftOrder =
                        selectedOrder.get(left.selectionTitle) || 1000;
                    const rightOrder =
                        selectedOrder.get(right.selectionTitle) || 1000;

                    if (leftOrder !== rightOrder) {
                        return leftOrder - rightOrder;
                    }
                }

                const yearDifference = right.year - left.year;
                if (yearDifference) return yearDifference;

                if (selectedOrder) {
                    const leftOrder =
                        selectedOrder.get(left.selectionTitle) || 1000;
                    const rightOrder =
                        selectedOrder.get(right.selectionTitle) || 1000;

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
        return Array.from(
            grid.querySelectorAll(".work-item:not([hidden])")
        );
    }

    function visiblePrimaryImages(currentWorks) {
        return currentWorks
            .map((work) =>
                work.querySelector("img:not([data-lightbox-only])")
            )
            .filter(Boolean);
    }

    function columnCount() {
        const columns = getComputedStyle(grid).gridTemplateColumns;
        return Math.max(1, columns.split(" ").filter(Boolean).length);
    }

    function imagesNeededBeforeReveal(images) {
        if (images.length <= 12) return images;
        return images.slice(0, 6);
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
                // Declared dimensions preserve the layout on failure.
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
        sculptureSeriesGrid?.setAttribute(
            "aria-busy",
            String(isLoading)
        );

        if (loadingIndicator) {
            loadingIndicator.setAttribute(
                "aria-hidden",
                String(!isLoading)
            );
        }
    }

    function imageSizes(span) {
        const desktopSize = {
            12: "calc(100vw - 3rem)",
            8: "calc(66.667vw - 3rem)",
            6: "calc(50vw - 3rem)",
            4: "calc(33.333vw - 3rem)",
            3: "calc(25vw - 3rem)"
        }[span] || "calc(33.333vw - 3rem)";

        const tabletSize = span === 12
            ? "calc(100vw - 3rem)"
            : "calc(50vw - 3rem)";

        return [
            "(max-width: 34rem) calc(100vw - 1.5rem)",
            `(max-width: 64rem) ${tabletSize}`,
            desktopSize
        ].join(", ");
    }

    function applyEditorialLayout(selected) {
        works.forEach((work) => {
            delete work.dataset.layoutSpan;
            delete work.dataset.layoutPosition;
            delete work.dataset.layoutPair;
            delete work.dataset.layoutFeature;
            work.style.removeProperty("grid-row-end");
            work.style.removeProperty("grid-column-start");
            work.style.removeProperty("--work-row-offset");

            const image = work.querySelector(
                "img:not([data-lightbox-only])"
            );
            if (image) image.sizes = imageSizes(4);
        });

        const layoutSpans = filterLayoutSpans.get(selected);
        if (!layoutSpans) return;

        const currentWorks = visibleWorks();

        currentWorks.forEach((work) => {
            const title = work
                .querySelector(".artwork-description strong")
                ?.textContent.trim() || "";
            const span = layoutSpans.get(title) || 4;
            work.dataset.layoutSpan = String(span);

            if (selected === "series-cracks-of-potential") {
                work.dataset.layoutPosition =
                    cracksLayoutPositions.get(title) || "";
            }

            if (
                selected === "series-ephemeral-structures"
                && title === "Tours et Détours"
            ) {
                work.dataset.layoutPosition = "ephemeral-first";
            }

            if (title === "Verdant Vistas I to IV") {
                work.dataset.layoutFeature = "verdant";
            }

            const image = work.querySelector(
                "img:not([data-lightbox-only])"
            );
            if (image) image.sizes = imageSizes(span);
        });

        for (let index = 0; index < currentWorks.length - 1; index += 1) {
            const left = currentWorks[index];
            const right = currentWorks[index + 1];

            if (
                left.dataset.layoutSpan === "6"
                && right.dataset.layoutSpan === "6"
                && !left.dataset.layoutPosition
                && !right.dataset.layoutPosition
            ) {
                left.dataset.layoutPosition = "pair-left";
                right.dataset.layoutPosition = "pair-right";

                const pairTitles = [left, right].map((work) =>
                    work.querySelector(".artwork-description strong")
                        ?.textContent.trim() || ""
                );
                if (
                    pairTitles[0] === "Été Indien"
                    && pairTitles[1] === "Fractal Forest"
                ) {
                    left.dataset.layoutPair = "equal-height";
                    right.dataset.layoutPair = "equal-height";
                }

                if (
                    (
                        pairTitles[0] === "Nature’s Chromatic Symphony"
                        || pairTitles[0] === "Symphonie Chromatique de la Nature"
                    )
                    && (
                        pairTitles[1] === "Power of the Relics"
                        || pairTitles[1] === "Pouvoir des Reliques"
                    )
                ) {
                    left.dataset.layoutPair = "wide-gap";
                    right.dataset.layoutPair = "wide-gap";
                }

                index += 1;
            }
        }

    }

    function alignRowTitles(currentWorks) {
        currentWorks.forEach((work) => {
            work.style.removeProperty("--work-row-offset");
            work.style.removeProperty("--paired-image-height");
            work.style.removeProperty("--description-inline-offset");
        });

        const columns = columnCount();

        if (columns > 2) {
            const pairedWorks = currentWorks.filter(
                (work) => work.dataset.layoutPair === "equal-height"
            );
            const pairedHeights = pairedWorks.map((work) =>
                work.querySelector("img:not([data-lightbox-only])")
                    ?.getBoundingClientRect().height || 0
            ).filter((height) => height > 0);

            if (pairedHeights.length > 1) {
                const pairedHeight = Math.min(...pairedHeights);
                pairedWorks.forEach((work) => {
                    work.style.setProperty(
                        "--paired-image-height",
                        `${pairedHeight}px`
                    );
                });
            }
        }

        currentWorks.forEach((work) => {
            const image = work.querySelector(
                "img:not([data-lightbox-only])"
            );
            const description = work.querySelector(".artwork-description");
            if (!image || !description) return;

            const offset = image.getBoundingClientRect().left
                - work.getBoundingClientRect().left;
            if (offset > 1) {
                work.style.setProperty(
                    "--description-inline-offset",
                    `${offset}px`
                );
            }
        });

        if (columns < 2 || !currentWorks.length) return;

        const measuredWorks = currentWorks
            .map((work) => {
                const description = work.querySelector(
                    ".artwork-description"
                );
                if (!description) return null;

                return {
                    work,
                    rowTop: work.getBoundingClientRect().top,
                    titleTop: description.getBoundingClientRect().top
                };
            })
            .filter(Boolean);

        function alignRow(row) {
            if (row.length < 2) return;

            const targetTitleTop = Math.max(
                ...row.map((item) => item.titleTop)
            );

            row.forEach(({ work, titleTop }) => {
                const offset = targetTitleTop - titleTop;
                if (offset > 1) {
                    work.style.setProperty(
                        "--work-row-offset",
                        `${offset}px`
                    );
                }
            });
        }

        /*
         * At the intermediate breakpoint every ordinary work occupies one
         * of two equal tracks. Pairing by document order is more reliable
         * than comparing row coordinates while lazy images are settling.
         */
        if (columns === 2) {
            let pairedRow = [];

            measuredWorks.forEach((item) => {
                if (item.work.dataset.layoutSpan === "12") {
                    alignRow(pairedRow);
                    pairedRow = [];
                    return;
                }

                pairedRow.push(item);

                if (pairedRow.length === 2) {
                    alignRow(pairedRow);
                    pairedRow = [];
                }
            });

            alignRow(pairedRow);
            return;
        }

        measuredWorks.sort((left, right) => left.rowTop - right.rowTop);

        let row = [];

        measuredWorks.forEach((item) => {
            if (!row.length || Math.abs(item.rowTop - row[0].rowTop) <= 2) {
                row.push(item);
                return;
            }

            alignRow(row);
            row = [item];
        });

        alignRow(row);
    }

    async function layoutWorks(currentWorks) {
        await nextFrame();
        alignRowTitles(currentWorks);
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
            const url = selected === defaultFilter
                ? location.pathname
                : `#${selected}`;
            history.replaceState(null, "", url);
        } catch {
            // Filtering still works without the History API.
        }
    }

    function updateVisibleContent(selected) {
        orderWorks(selected);
        archivePage.dataset.activeFilter = selected;

        const showSculptureSeries = selected === "sculpture";
        grid.hidden = showSculptureSeries;
        if (sculptureSeriesGrid) {
            sculptureSeriesGrid.hidden = !showSculptureSeries;
        }

        works.forEach((work) => {
            const title = work
                .querySelector(".artwork-description strong")
                ?.textContent.trim() || "";
            const matchesMedium = work.dataset.medium === selected;
            const matchesSeries =
                selected.startsWith("series-")
                && work.dataset.series
                    === selected.slice("series-".length);

            work.hidden = showSculptureSeries
                || (!matchesMedium && !matchesSeries);
        });

        applyEditorialLayout(selected);

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

    async function applyFilter(filter, updateUrl = true, force = false) {
        const selected = validFilters.has(filter) ? filter : defaultFilter;

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
        const linkedWork = hash ? document.getElementById(hash) : null;

        if (linkedWork && linkedWork.classList.contains("work-item")) {
            await applyFilter(
                linkedWork.dataset.medium || defaultFilter,
                false,
                true
            );
            linkedWork.scrollIntoView({ block: "start" });
            return;
        }

        await applyFilter(
            validFilters.has(hash) ? hash : defaultFilter,
            false,
            true
        );
    }

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            applyFilter(button.dataset.filter || defaultFilter);
        });
    });

    filters.hidden = false;
    grid.classList.remove("is-masonry", "is-measuring");
    setLoading(true);

    works.forEach((work) => {
        const image = work.querySelector(
            "img:not([data-lightbox-only])"
        );
        if (!image) return;

        if (image.complete) {
            markImageReady(image);
            return;
        }

        const finishImage = () => markImageReady(image);
        image.addEventListener("load", finishImage, { once: true });
        image.addEventListener("error", finishImage, { once: true });
    });

    if (document.fonts?.ready) {
        Promise.resolve(document.fonts.ready)
            .then(() => {
                alignRowTitles(visibleWorks());
            })
            .catch(() => undefined);
    }

    window.addEventListener("hashchange", applyLocationHash);

    window.addEventListener("resize", () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
            alignRowTitles(visibleWorks());
        });

        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            alignRowTitles(visibleWorks());
        }, 220);
    });

    buildSculptureSeriesGrid();
    applyLocationHash();
})();
