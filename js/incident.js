import { supabase } from './supabase.js';
import { auth } from './auth.js';
import { encrypt, generateFileHash } from './crypto.js';

/**
 * Incident reporting logic
 */

export async function submitIncident({ description, location, dateValue, files, onProgress }) {
    const session = await auth.getSession();
    if (!session) throw new Error('Not logged in');
    
    const passphrase = sessionStorage.getItem('vault_key');
    if (!passphrase) throw new Error('Vault is locked. Please unlock it first.');

    const user = session.user;
    const userId = user.id;

    if (onProgress) onProgress(5);

    // 1. Encrypt text data
    const encryptedDescription = await encrypt(description, passphrase, userId);
    const encryptedLocation = await encrypt(location, passphrase, userId);

    if (onProgress) onProgress(15);

    let file_paths = [];
    let file_hashes = [];

    // 2. Handle files if exist
    if (files && files.length > 0) {
        const totalFiles = files.length;
        for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            const file_hash = await generateFileHash(file);
            file_hashes.push(file_hash);
            
            const fileBuffer = await file.arrayBuffer();
            const encryptedFileBase64 = await encrypt(fileBuffer, passphrase, userId);
            
            const binaryString = atob(encryptedFileBase64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let j = 0; j < len; j++) {
                bytes[j] = binaryString.charCodeAt(j);
            }
            const encryptedBlob = new Blob([bytes], { type: 'application/octet-stream' });

            const fileName = `${userId}/${Date.now()}_${i}_${file.name}.enc`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('evidence')
                .upload(fileName, encryptedBlob);

            if (uploadError) throw uploadError;
            file_paths.push(uploadData.path);
            
            if (onProgress) {
                const progress = 15 + ((i + 1) / totalFiles) * 75;
                onProgress(Math.round(progress));
            }
        }
    }

    // 3. Insert into DB
    const { data, error } = await supabase
        .from("incidents")
        .insert([{
            user_id: userId,
            description: encryptedDescription,
            location: encryptedLocation,
            date: new Date(dateValue).toISOString(),
            file_path: file_paths.length > 0 ? JSON.stringify(file_paths) : null,
            file_hash: file_hashes.length > 0 ? JSON.stringify(file_hashes) : null
        }]);

    if (onProgress) onProgress(100);
    if (error) throw error;
    return data;
}
