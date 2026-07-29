(() => {
    const form = document.querySelector("[data-protected-download-form]");
    if (!form) return;

    const documents = {
        "portfolio-en": {
            source: "/portfolio/downloads/portfolio-en.vgpdf",
            filename: "V Guerin - Portfolio EN.pdf"
        },
        "portfolio-fr": {
            source: "/portfolio/downloads/portfolio-fr.vgpdf",
            filename: "V Guerin - Portfolio FR.pdf"
        },
        "millenium-fr": {
            source: "/portfolio/downloads/millenium-fr.vgpdf",
            filename: "V Guerin - 2027 MILLENIUM FR.pdf"
        }
    };
    const iterations = 250000;
    const salt = Uint8Array.from(
        atob("JgkTJtCUv6erKKZdf7yBaA=="),
        (character) => character.charCodeAt(0)
    );
    const expectedVerifier = "c473c68fa551713e953dfebf66e5137c62263912dc7ea24a7d7dc09477a9b358";
    const codeInput = form.querySelector("[data-download-code]");
    const status = form.querySelector("[data-download-status]");
    const buttons = Array.from(form.querySelectorAll("[data-download-id]"));
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    form.addEventListener("submit", (event) => {
        event.preventDefault();
    });

    if (!window.crypto?.subtle) {
        buttons.forEach((button) => {
            button.disabled = true;
        });
        status.textContent = form.dataset.unsupportedMessage;
        return;
    }

    function toHex(buffer) {
        return Array.from(new Uint8Array(buffer), (byte) =>
            byte.toString(16).padStart(2, "0")
        ).join("");
    }

    function setBusy(busy) {
        buttons.forEach((button) => {
            button.disabled = busy;
        });
        form.setAttribute("aria-busy", String(busy));
    }

    async function deriveKey(code) {
        const passphraseKey = await crypto.subtle.importKey(
            "raw",
            encoder.encode(code),
            "PBKDF2",
            false,
            ["deriveBits"]
        );
        const keyBytes = await crypto.subtle.deriveBits(
            {
                name: "PBKDF2",
                hash: "SHA-256",
                salt,
                iterations
            },
            passphraseKey,
            256
        );
        const verifier = toHex(await crypto.subtle.digest("SHA-256", keyBytes));
        if (verifier !== expectedVerifier) return null;

        return crypto.subtle.importKey(
            "raw",
            keyBytes,
            "AES-GCM",
            false,
            ["decrypt"]
        );
    }

    async function downloadDocument(documentId) {
        const documentRecord = documents[documentId];
        if (!documentRecord) throw new Error("Unknown document");

        const key = await deriveKey(codeInput.value.trim());
        if (!key) {
            status.textContent = form.dataset.invalidMessage;
            codeInput.select();
            codeInput.focus();
            return;
        }

        status.textContent = form.dataset.preparingMessage;
        const response = await fetch(documentRecord.source, { cache: "no-store" });
        if (!response.ok) throw new Error("Protected file unavailable");

        const payload = new Uint8Array(await response.arrayBuffer());
        const magic = decoder.decode(payload.slice(0, 8));
        if (magic !== "VGPDF001" || payload.length <= 36) {
            throw new Error("Invalid protected file");
        }

        const iv = payload.slice(8, 20);
        const encrypted = payload.slice(20);
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            encrypted
        );
        const url = URL.createObjectURL(
            new Blob([decrypted], { type: "application/pdf" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = documentRecord.filename;
        link.hidden = true;
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
        status.textContent = form.dataset.successMessage;
    }

    form.addEventListener("submit", async (event) => {
        const submitter = event.submitter;
        const documentId = submitter?.dataset.downloadId;
        if (!documentId) return;

        setBusy(true);
        status.textContent = "";
        try {
            await downloadDocument(documentId);
        } catch {
            status.textContent = form.dataset.errorMessage;
        } finally {
            setBusy(false);
        }
    });
})();
