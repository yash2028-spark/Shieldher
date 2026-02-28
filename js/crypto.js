/**
<<<<<<< HEAD
 * Crypto utilities for ShieldHer
 */

const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const ALGORITHM = 'AES-GCM';

export async function hashPassphrase(passphrase) {
    if (!crypto.subtle) {
        throw new Error('Web Crypto API is not supported in this browser. Please use a modern browser.');
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function deriveKey(passphrase, userId) {
    const encoder = new TextEncoder();
    const passphraseBytes = encoder.encode(passphrase);
=======
 * Crypto utility for ShieldHer
 * Implements PBKDF2, AES-GCM, and SHA-256
 */

export async function deriveKey(passphrase, userId) {
    const encoder = new TextEncoder();
>>>>>>> c5231dceeb0d9cfbf8638c21e4710441a917b1b8
    const salt = encoder.encode(`shieldher-${userId}`);
    const baseKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(passphrase),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encrypt(data, key) {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = typeof data === 'string' ? encoder.encode(data) : data;

    const encryptedContent = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encodedData
    );

    // Combine IV + Encrypted Data
    const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedContent), iv.length);

    // For small data (strings), return base64
    if (typeof data === 'string') {
        return btoa(String.fromCharCode(...combined));
    }
    // For binary data (files), return the Uint8Array directly
    return combined;
}

export async function decrypt(encryptedData, key) {
    let combined;
    if (typeof encryptedData === 'string') {
        combined = new Uint8Array(
            atob(encryptedData)
                .split("")
                .map((c) => c.charCodeAt(0))
        );
    } else {
        combined = encryptedData;
    }

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedContent = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        data
    );

    return new TextDecoder().decode(decryptedContent);
}

export async function decryptBuffer(combined, key) {
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedContent = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        data
    );

    return decryptedContent;
}

export async function generateHash(data) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
