(() => {
    const forms = Array.from(document.querySelectorAll("[data-protected-download-form]"));
    if (!forms.length) return;

    const downloadGroups = {
        portfolio: {
            verifier: "c473c68fa551713e953dfebf66e5137c62263912dc7ea24a7d7dc09477a9b358",
            documents: {
                "portfolio-en": {
                    source: "/documents/downloads/portfolio-en.vgpdf",
                    filename: "V Guerin - Portfolio EN.pdf"
                },
                "portfolio-fr": {
                    source: "/documents/downloads/portfolio-fr.vgpdf",
                    filename: "V Guerin - Portfolio FR.pdf"
                },
                "millenium-fr": {
                    source: "/documents/downloads/millenium-fr.vgpdf",
                    filename: "V Guerin - 2027 MILLENIUM FR.pdf"
                }
            }
        },
        press: {
            verifier: "afd4beeaf233e8ab4a70a4d85b982e32fe9005b29f63cfd59e1d19bd55a56782",
            documents: {
                "loud-speaker-press-en": {
                    source: "/documents/downloads/loud-speaker-press-en.vgzip",
                    filename: "Victor Guerin | Loud Speaker.zip",
                    mimeType: "application/zip",
                    magic: "VGZIP001"
                },
                "loud-speaker-press-fr": {
                    source: "/documents/downloads/loud-speaker-press-fr.vgzip",
                    filename: "Victor Guerin | Loud Speaker FR.zip",
                    mimeType: "application/zip",
                    magic: "VGZIP001"
                }
            }
        }
    };
    const iterations = 250000;
    const salt = Uint8Array.from(
        atob("JgkTJtCUv6erKKZdf7yBaA=="),
        (character) => character.charCodeAt(0)
    );
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    function toHex(buffer) {
        return Array.from(new Uint8Array(buffer), (byte) =>
            byte.toString(16).padStart(2, "0")
        ).join("");
    }

    forms.forEach((form) => {
        const group = downloadGroups[form.dataset.downloadGroup];
        if (!group) return;

        const codeInput = form.querySelector("[data-download-code]");
        const status = form.querySelector("[data-download-status]");
        const buttons = Array.from(form.querySelectorAll("[data-download-id]"));

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
            if (verifier !== group.verifier) return null;

            return crypto.subtle.importKey(
                "raw",
                keyBytes,
                "AES-GCM",
                false,
                ["decrypt"]
            );
        }

        async function downloadDocument(documentId) {
            const documentRecord = group.documents[documentId];
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
            if (magic !== (documentRecord.magic || "VGPDF001") || payload.length <= 36) {
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
                new Blob([decrypted], { type: documentRecord.mimeType || "application/pdf" })
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

        if (!window.crypto?.subtle) {
            buttons.forEach((button) => {
                button.disabled = true;
            });
            status.textContent = form.dataset.unsupportedMessage;
            return;
        }

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const documentId = event.submitter?.dataset.downloadId;
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
    });
})();
