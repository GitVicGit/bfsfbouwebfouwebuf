import { webcrypto } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const [, , inputPath, outputPath] = process.argv;
const passphrase = process.env.DOWNLOAD_CODE;

if (!inputPath || !outputPath || !passphrase) {
    console.error("Usage: DOWNLOAD_CODE=… node scripts/encrypt-download.mjs INPUT OUTPUT");
    process.exit(1);
}

const iterations = 250000;
const salt = Uint8Array.from(Buffer.from("JgkTJtCUv6erKKZdf7yBaA==", "base64"));
const passphraseKey = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits"]
);
const keyBytes = await webcrypto.subtle.deriveBits(
    {
        name: "PBKDF2",
        hash: "SHA-256",
        salt,
        iterations
    },
    passphraseKey,
    256
);
const encryptionKey = await webcrypto.subtle.importKey(
    "raw",
    keyBytes,
    "AES-GCM",
    false,
    ["encrypt"]
);
const iv = webcrypto.getRandomValues(new Uint8Array(12));
const source = await readFile(inputPath);
const encrypted = await webcrypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    encryptionKey,
    source
);
const verifier = Buffer.from(
    await webcrypto.subtle.digest("SHA-256", keyBytes)
).toString("hex");

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
    outputPath,
    Buffer.concat([
        Buffer.from("VGPDF001", "ascii"),
        Buffer.from(iv),
        Buffer.from(encrypted)
    ])
);

console.log(`Encrypted ${inputPath} -> ${outputPath}`);
console.log(`Key verifier: ${verifier}`);
