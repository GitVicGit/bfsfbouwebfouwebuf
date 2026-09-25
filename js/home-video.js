(() => {
    "use strict";

    const video = document.querySelector(".home-film__video");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!video) {
        return;
    }

    const startVideo = () => {
        if (reducedMotion.matches) {
            video.pause();
            return;
        }

        video.muted = true;

        if (video.currentTime < 5) {
            video.currentTime = 5;
        }

        video.play().catch(() => {});
    };

    if (video.readyState >= 1) {
        startVideo();
    } else {
        video.addEventListener("loadedmetadata", startVideo, { once: true });
    }

    reducedMotion.addEventListener?.("change", startVideo);
})();
