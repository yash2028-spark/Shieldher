/** */
const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const ALGORITHM = 'AES-GCM';

export async function hashPassphrase(passphrase){
    if (!crypto.subtle){
        throw new Error('Web Crypto API is not supported in this browser. Please use a modern browser.');
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase);
    const hashBuffer = await crypto.subtle.digest('SHA-256',data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}