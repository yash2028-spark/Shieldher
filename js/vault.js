import { supabase } from './supabase.js';
import { decrypt, decryptBuffer, generateHash } from './crypto.js';

export async function fetchIncidents(vaultKey) {
    const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    const decryptedIncidents = await Promise.all(data.map(async (incident) => {
        try {
            const description = await decrypt(incident.description, vaultKey);
            const location = await decrypt(incident.location, vaultKey);
            return {
                ...incident,
                description,
                location,
                filePaths: JSON.parse(incident.file_path || '[]'),
                fileHashes: JSON.parse(incident.file_hash || '[]')
            };
        } catch (e) {
            console.error("Decryption failed for incident", incident.id, e);
            return {
                ...incident,
                description: "[Decryption Failed]",
                location: "[Decryption Failed]",
                decryptionError: true
            };
        }
    }));

    return decryptedIncidents;
}

export async function downloadFile(filePath, expectedHash, vaultKey) {
    const { data, error } = await supabase.storage
        .from('evidence')
        .download(filePath);

    if (error) throw error;

    const encryptedBuffer = await data.arrayBuffer();
    const decryptedBuffer = await decryptBuffer(new Uint8Array(encryptedBuffer), vaultKey);
    
    const actualHash = await generateHash(decryptedBuffer);
    
    if (actualHash !== expectedHash) {
        throw new Error("Integrity check failed! File may have been tampered with.");
    }

    const blob = new Blob([decryptedBuffer]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filePath.split('/').pop().replace('.enc', '');
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
}

export function generateReport(incident) {
    const content = `
ShieldHer Incident Report
-------------------------
ID: ${incident.id}
Date: ${new Date(incident.date).toLocaleString()}
Created At: ${new Date(incident.created_at).toLocaleString()}

Location: ${incident.location}
Description:
${incident.description}

Files: ${incident.filePaths.length}
-------------------------
Generated on: ${new Date().toLocaleString()}
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShieldHer_Report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
}
