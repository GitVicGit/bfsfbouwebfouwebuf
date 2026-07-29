(() => {
    const protectedMedia = "img, a[data-embedded-image]";

    document.querySelectorAll("img").forEach((image) => {
        image.draggable = false;
    });

    document.addEventListener("contextmenu", (event) => {
        if (event.target.closest(protectedMedia)) event.preventDefault();
    });

    document.addEventListener("dragstart", (event) => {
        if (event.target.closest(protectedMedia)) event.preventDefault();
    });
})();
