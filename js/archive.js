(() => {
    const grid = document.querySelector("#work-grid");
    const filters = document.querySelector(".archive-filters");
    if (!grid || !filters) return;

    const buttons = Array.from(filters.querySelectorAll("button[data-filter]"));
    const works = Array.from(grid.querySelectorAll(".work-item"));
    const seriesIntroductions = Array.from(document.querySelectorAll("[data-series-introduction]"));
    const archivePage = document.querySelector(".archive-page");
    const languageSwitch = document.querySelector(".lang-switch");
    const languageSwitchUrl = languageSwitch
        ? new URL(languageSwitch.getAttribute("href"), location.href)
        : null;
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
    const options = new Set([
        "sculpture",
        "installation",
        "painting",
        "moving-image",
        "series-cracks-of-potential",
        "series-antidote",
        "series-echoes-of-extraction",
        "series-ephemeral-structures",
        "series-deposit"
    ]);
    let layoutFrame = 0;
    let layoutRun = 0;
    let canRevealLayout = false;

    function workYear(work) {
        const paragraphs = Array.from(work.querySelectorAll(".artwork-description p"));
        const year = paragraphs
            .map((paragraph) => paragraph.textContent.trim())
            .find((value) => /^(?:19|20)\d{2}$/.test(value));
        return Number.parseInt(year, 10) || 0;
    }

    const workRecords = works.map((work, index) => ({
        work,
        index,
        year: workYear(work),
        title: work.querySelector("img:not([data-lightbox-only])")?.alt.trim() || ""
    }));

    function orderWorks(selected) {
        workRecords
            .slice()
            .sort((left, right) => {
                const yearDifference = right.year - left.year;
                if (yearDifference) return yearDifference;

                if (selected === "painting" && left.year === 2025) {
                    const leftOrder = paintingOrder2025.get(left.title) || 1000;
                    const rightOrder = paintingOrder2025.get(right.title) || 1000;
                    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
                }

                return left.index - right.index;
            })
            .forEach(({ work }) => grid.append(work));
    }

    function alignNearlyLevelDescriptions(visibleWorks) {
        const columnCount = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
        const descriptions = visibleWorks
            .map((work) => work.querySelector(".artwork-description"))
            .filter(Boolean);

        descriptions.forEach((description) => {
            description.style.removeProperty("--description-align-offset");
        });
        if (columnCount < 2) return;

        const lineHeight = descriptions[0]
            ? Number.parseFloat(getComputedStyle(descriptions[0]).lineHeight)
            : 0;
        const maximumCorrection = lineHeight * 0.75;
        const sorted = descriptions
            .map((description) => ({
                description,
                top: description.getBoundingClientRect().top
            }))
            .sort((left, right) => left.top - right.top);

        let group = [];
        sorted.forEach((item) => {
            if (!group.length || item.top - group[0].top <= maximumCorrection) {
                group.push(item);
                return;
            }

            alignGroup(group);
            group = [item];
        });
        alignGroup(group);

        function alignGroup(items) {
            if (items.length < 2) return;
            const targetTop = Math.max(...items.map((item) => item.top));
            items.forEach(({ description, top }) => {
                const correction = targetTop - top;
                if (correction > 1 && correction <= maximumCorrection) {
                    description.style.setProperty("--description-align-offset", `${correction}px`);
                }
            });
        }
    }

    function layoutWorks() {
        cancelAnimationFrame(layoutFrame);
        const currentRun = ++layoutRun;
        layoutFrame = requestAnimationFrame(() => {
            const visibleWorks = works.filter((work) => !work.hidden);
            const initialLayout = !grid.classList.contains("is-masonry");

            if (initialLayout) {
                visibleWorks.forEach((work) => {
                    const spacing = Number.parseFloat(getComputedStyle(work).marginBottom) || 0;
                    work.style.gridRowEnd = `span ${Math.ceil(work.scrollHeight + spacing)}`;
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
                    const spacing = Number.parseFloat(getComputedStyle(work).marginBottom) || 0;
                    work.style.gridRowEnd = `span ${Math.ceil(work.scrollHeight + spacing)}`;
                });

                requestAnimationFrame(() => {
                    if (currentRun !== layoutRun) return;
                    alignNearlyLevelDescriptions(visibleWorks);
                    visibleWorks.forEach((work) => {
                        const spacing = Number.parseFloat(getComputedStyle(work).marginBottom) || 0;
                        work.style.gridRowEnd = `span ${Math.ceil(work.scrollHeight + spacing)}`;
                    });
                    if (canRevealLayout) {
                        grid.classList.add("is-layout-ready");
                        grid.removeAttribute("aria-busy");
                    }
                });
            });
        });
    }

    function syncLanguageSwitch() {
        if (!languageSwitch || !languageSwitchUrl) return;
        const target = new URL(languageSwitchUrl.href);
        target.hash = location.hash;
        languageSwitch.href = `${target.pathname}${target.search}${target.hash}`;
    }

    function applyFilter(filter, updateUrl = true) {
        const selected = options.has(filter) ? filter : "all";
        orderWorks(selected);
        works.forEach((work) => {
            const matchesMedium = work.dataset.medium === selected;
            const matchesSeries = selected.startsWith("series-")
                && work.dataset.series === selected.slice("series-".length);
            work.hidden = selected !== "all" && !matchesMedium && !matchesSeries;
        });

        buttons.forEach((button) => {
            button.setAttribute("aria-pressed", String(button.dataset.filter === selected));
        });

        seriesIntroductions.forEach((introduction) => {
            introduction.hidden = selected !== `series-${introduction.dataset.seriesIntroduction}`;
        });
        archivePage?.classList.toggle(
            "has-series-introduction",
            seriesIntroductions.some((introduction) => !introduction.hidden)
        );

        if (updateUrl) {
            const url = selected === "all" ? location.pathname : `#${selected}`;
            history.replaceState(null, "", url);
        }
        syncLanguageSwitch();
        layoutWorks();
    }

    function applyLocationHash() {
        const hash = location.hash.slice(1);
        const linkedWork = hash ? document.getElementById(hash) : null;

        if (linkedWork?.classList.contains("work-item")) {
            applyFilter(linkedWork.dataset.medium || "all", false);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => linkedWork.scrollIntoView({ block: "start" }));
            });
            return;
        }

        if (!hash || options.has(hash)) applyFilter(hash, false);
    }

    grid.classList.add("is-measuring");
    grid.setAttribute("aria-busy", "true");
    filters.hidden = false;
    filters.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-filter]");
        if (button) applyFilter(button.dataset.filter);
    });
    window.addEventListener("hashchange", applyLocationHash);
    window.addEventListener("resize", layoutWorks);
    grid.querySelectorAll("img").forEach((image) => {
        if (!image.complete) {
            image.addEventListener("load", () => {
                if (grid.classList.contains("is-layout-ready")) layoutWorks();
            }, { once: true });
        }
    });
    applyLocationHash();

    const fontReadiness = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([
        Promise.resolve(fontReadiness).catch(() => undefined),
        new Promise((resolve) => window.setTimeout(resolve, 1000))
    ]).then(() => {
        canRevealLayout = true;
        layoutWorks();
    });
})();
