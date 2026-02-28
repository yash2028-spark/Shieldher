import { supabase } from './supabase.js';
import { auth } from './auth.js';
import { decrypt } from './crypto.js';

/**
 * Vault history logic
 */

export async function fetchIncidents() {
    const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function decryptIncident(incident, passphrase, userId) {
    try {
        const description = await decrypt(incident.description, passphrase, userId, true);
        const location = await decrypt(incident.location, passphrase, userId, true);
        
        return {
            ...incident,
            decrypted: {
                description,
                location
            }
        };
    } catch (e) {
        console.error("Decryption failed for incident", incident.id, e);
        return { ...incident, decryptionError: true };
    }
}

export async function downloadFile(incident) {
    const session = await auth.getSession();
    const passphrase = sessionStorage.getItem('vault_key');
    const userId = session.user.id;

    let filePaths = [];
    try {
        filePaths = JSON.parse(incident.file_path);
        if (!Array.isArray(filePaths)) filePaths = [incident.file_path];
    } catch (e) {
        filePaths = [incident.file_path];
    }

    for (const path of filePaths) {
        const { data, error } = await supabase.storage
            .from('evidence')
            .download(path);

        if (error) {
            console.error("Download failed for", path, error);
            continue;
        }

        const buffer = await data.arrayBuffer();
        
        // Convert arrayBuffer to base64 safely
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        
        const decryptedBuffer = await decrypt(base64, passphrase, userId);
        
        const blob = new Blob([decryptedBuffer]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // Extract original name
        const parts = path.split('_');
        const originalName = parts.length > 2 
            ? parts.slice(2).join('_').replace('.enc', '')
            : parts.slice(1).join('_').replace('.enc', '');
        
        a.href = url;
        a.download = originalName;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Small delay between downloads to avoid browser blocking
        await new Promise(r => setTimeout(r, 500));
    }
}

export function downloadSummary(reportText, date) {
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShieldHer_Report_${new Date(date).getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
}
