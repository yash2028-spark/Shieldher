/**
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
    const salt = encoder.encode(`shieldher-${userId}`);

    const baseKey = await crypto.subtle.importKey(
        'raw',
        passphraseBytes,
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: ITERATIONS,
            hash: 'SHA-256'
        },
        baseKey,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Helper to convert Uint8Array to Base64 safely
 */
function uint8ArrayToBase64(bytes) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Helper to convert Base64 to Uint8Array safely
 */
function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export async function encrypt(data, passphrase, userId) {
    const key = await deriveKey(passphrase, userId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const dataToEncrypt = typeof data === 'string' ? encoder.encode(data) : data;

    const encryptedData = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv: iv },
        key,
        dataToEncrypt
    );

    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    return uint8ArrayToBase64(combined);
}

export async function decrypt(base64String, passphrase, userId, isText = false) {
    const key = await deriveKey(passphrase, userId);
    const bytes = base64ToUint8Array(base64String);
    
    const iv = bytes.slice(0, 12);
    const encryptedData = bytes.slice(12).buffer;

    const decryptedData = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv: iv },
        key,
        encryptedData
    );

    if (isText) {
        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    }
    return decryptedData;
}

export async function generateFileHash(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
