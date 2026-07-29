(() => {
    function revealFragmentTarget() {
        let id = "";
        try {
            id = decodeURIComponent(location.hash.slice(1));
        } catch {
            return;
        }
        const target = id ? document.getElementById(id) : null;
        const essay = target?.closest("details.series-essay");
        if (essay) {
            essay.open = true;
            requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
        }
    }

    document.addEventListener("click", (event) => {
        const button = event.target.closest("[data-collapse-series-essay]");
        if (!button) return;

        const essay = button.closest("details");
        const summary = essay?.querySelector("summary");
        if (!essay || !summary) return;

        essay.open = false;
        summary.focus();
    });

    window.addEventListener("hashchange", revealFragmentTarget);
    revealFragmentTarget();
})();
