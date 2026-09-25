(() => {
    "use strict";

    const iframe = document.querySelector(".home-film__media iframe");

    if (!iframe || !window.Vimeo || typeof window.Vimeo.Player !== "function") {
        return;
    }

    const player = new window.Vimeo.Player(iframe);
    const disableCaptions = () => {
        player.disableTextTrack().catch(() => {});
    };

    disableCaptions();
    player.on("play", disableCaptions);
    player.on("texttrackchange", (track) => {
        if (track && track.language) {
            disableCaptions();
        }
    });
})();
