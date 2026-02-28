import { supabase } from './supabase.js';
import { encrypt, generateHash } from './crypto.js';

export async function submitIncident(description, location, date, files, vaultKey) {
    const session = await supabase.auth.getSession();
    const userId = session.data.session.user.id;

    // Encrypt metadata
    const encryptedDescription = await encrypt(description, vaultKey);
    const encryptedLocation = await encrypt(location, vaultKey);

    const filePaths = [];
    const fileHashes = [];

    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const hash = await generateHash(arrayBuffer);
        
        // Encrypt file data
        const encryptedFileData = await encrypt(new Uint8Array(arrayBuffer), vaultKey);
        const encryptedFileBlob = new Blob([encryptedFileData], { type: 'application/octet-stream' });

        const fileName = `${Date.now()}_${file.name}.enc`;
        const filePath = `${userId}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('evidence')
            .upload(filePath, encryptedFileBlob);

        if (error) throw error;

        filePaths.push(filePath);
        fileHashes.push(hash);
    }

    const { data, error } = await supabase
        .from('incidents')
        .insert([
            {
                user_id: userId,
                description: encryptedDescription,
                location: encryptedLocation,
                date: date,
                file_path: JSON.stringify(filePaths),
                file_hash: JSON.stringify(fileHashes)
            }
        ]);

    if (error) throw error;
    return data;
}
