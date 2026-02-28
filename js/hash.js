/**
 * Generates a SHA-256 hash of a file
 * @param {File|Blob} file 
 * @returns {Promise<string>}
 */
export async function generateFileHash(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Verifies if the data matches the expected hash
 * @param {ArrayBuffer} data 
 * @param {string} expectedHash 
 * @returns {Promise<boolean>}
 */
export async function verifyIntegrity(data, expectedHash) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const actualHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return actualHash === expectedHash;
}
