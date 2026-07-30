(() => {
    const grid = document.querySelector("#work-grid");
    const filters = document.querySelector(".archive-filters");

    if (!grid || !filters) return;

    const buttons = Array.from(
        filters.querySelectorAll("button[data-filter]")
    );

    const works = Array.from(
        grid.querySelectorAll(".work-item")
    );

    const seriesIntroductions = Array.from(
        document.querySelectorAll("[data-series-introduction]")
    );

    const archivePage = document.querySelector(".archive-page");
    const languageSwitch = document.querySelector(".lang-switch");

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

    let layoutFrame = 0;
    let layoutRun = 0;

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

                if (yearDifference) {
                    return yearDifference;
                }

                if (
                    selected === "painting"
                    && left.year === 2025
                ) {
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

    function alignNearlyLevelDescriptions(visibleWorks) {
        const columnCount = getComputedStyle(grid)
            .gridTemplateColumns
            .split(" ")
            .length;

        const descriptions = visibleWorks
            .map((work) =>
                work.querySelector(".artwork-description")
            )
            .filter(Boolean);

        descriptions.forEach((description) => {
            description.style.removeProperty(
                "--description-align-offset"
            );
        });

        if (columnCount < 2 || !descriptions.length) {
            return;
        }

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

    function revealGrid() {
        grid.classList.add("is-layout-ready");
        grid.removeAttribute("aria-busy");
    }

    function layoutWorks() {
        cancelAnimationFrame(layoutFrame);

        const currentRun = ++layoutRun;

        layoutFrame = requestAnimationFrame(() => {
            try {
                const visibleWorks = works.filter(
                    (work) => !work.hidden
                );

                const initialLayout =
                    !grid.classList.contains("is-masonry");

                if (initialLayout) {
                    visibleWorks.forEach((work) => {
                        const spacing =
                            Number.parseFloat(
                                getComputedStyle(work).marginBottom
                            ) || 0;

                        work.style.gridRowEnd =
                            `span ${Math.ceil(
                                work.scrollHeight + spacing
                            )}`;
                    });

                    grid.classList.remove("is-measuring");
                    grid.classList.add("is-masonry");
                } else {
                    visibleWorks.forEach((work) => {
                        work.style.gridRowEnd = "auto";
                    });
                }

                requestAnimationFrame(() => {
                    if (currentRun !== layoutRun) return;

                    visibleWorks.forEach((work) => {
                        const spacing =
                            Number.parseFloat(
                                getComputedStyle(work).marginBottom
                            ) || 0;

                        work.style.gridRowEnd =
                            `span ${Math.ceil(
                                work.scrollHeight + spacing
                            )}`;
                    });

                    requestAnimationFrame(() => {
                        if (currentRun !== layoutRun) return;

                        alignNearlyLevelDescriptions(
                            visibleWorks
                        );

                        visibleWorks.forEach((work) => {
                            const spacing =
                                Number.parseFloat(
                                    getComputedStyle(work).marginBottom
                                ) || 0;

                            work.style.gridRowEnd =
                                `span ${Math.ceil(
                                    work.scrollHeight + spacing
                                )}`;
                        });

                        revealGrid();
                    });
                });
            } catch (error) {
                revealGrid();

                console.error(
                    "Works archive layout failed",
                    error
                );
            }
        });
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
            /*
             * A language-link error must not prevent
             * the archive filters from working.
             */
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
            /*
             * Filtering still works when History API
             * access is unavailable.
             */
        }
    }

    function applyFilter(filter, updateUrl = true) {
        const selected = validFilters.has(filter)
            ? filter
            : "all";

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
                String(
                    button.dataset.filter === selected
                )
            );
        });

        seriesIntroductions.forEach((introduction) => {
            introduction.hidden =
                selected
                !== `series-${
                    introduction.dataset.seriesIntroduction
                }`;
        });

        if (archivePage) {
            archivePage.classList.toggle(
                "has-series-introduction",
                seriesIntroductions.some(
                    (introduction) => !introduction.hidden
                )
            );
        }

        if (updateUrl) {
            updateAddress(selected);
        }

        syncLanguageSwitch();
        layoutWorks();
    }

    function applyLocationHash() {
        const hash = location.hash.slice(1);

        const linkedWork = hash
            ? document.getElementById(hash)
            : null;

        if (
            linkedWork
            && linkedWork.classList.contains("work-item")
        ) {
            applyFilter(
                linkedWork.dataset.medium || "all",
                false
            );

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    linkedWork.scrollIntoView({
                        block: "start"
                    });
                });
            });

            return;
        }

        applyFilter(
            validFilters.has(hash) ? hash : "all",
            false
        );
    }

    /*
     * Attach each filter directly so a layout,
     * URL or language-switch error cannot disable
     * all the filter buttons.
     */
    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            applyFilter(
                button.dataset.filter || "all"
            );
        });
    });

    /*
     * Prioritise the first visible row.
     */
    Array.from(
        grid.querySelectorAll(
            ".work-item img:not([data-lightbox-only])"
        )
    )
        .slice(0, 4)
        .forEach((image, index) => {
            image.removeAttribute("loading");
            image.loading = "eager";

            if (index === 0) {
                image.setAttribute(
                    "fetchpriority",
                    "high"
                );
            }
        });

    grid.classList.add("is-measuring");
    grid.setAttribute("aria-busy", "true");
    filters.hidden = false;

    window.addEventListener(
        "hashchange",
        applyLocationHash
    );

    window.addEventListener(
        "resize",
        layoutWorks
    );

    grid.querySelectorAll("img").forEach((image) => {
        if (!image.complete) {
            image.addEventListener(
                "load",
                () => {
                    if (
                        grid.classList.contains(
                            "is-layout-ready"
                        )
                    ) {
                        layoutWorks();
                    }
                },
                { once: true }
            );
        }
    });

    applyLocationHash();

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready
            .then(layoutWorks)
            .catch(() => undefined);
    }

    window.addEventListener(
        "load",
        layoutWorks,
        { once: true }
    );
})();
