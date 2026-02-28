import { supabase } from './supabase.js';
import { decryptData, unpackageEncrypted } from './crypto.js';
import { verifyIntegrity } from './hash.js';
import { auth } from './auth.js';

/**
 * Incident History and Export management
 */

export async function fetchIncidents() {
    const session = await auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('Incidents')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function decryptIncident(incident, passphrase, userId) {
    try {
        const locPkg = unpackageEncrypted(incident.location);
        const datePkg = unpackageEncrypted(incident.date);
        const descPkg = unpackageEncrypted(incident.description);

        const location = await decryptData(locPkg.encryptedData, locPkg.iv, passphrase, userId, true);
        const date = await decryptData(datePkg.encryptedData, datePkg.iv, passphrase, userId, true);
        const description = await decryptData(descPkg.encryptedData, descPkg.iv, passphrase, userId, true);

        return {
            ...incident,
            decrypted: {
                location: JSON.parse(location),
                date: JSON.parse(date),
                description: description
            }
        };
    } catch (error) {
        console.error('Decryption error for incident:', incident.id, error);
        return { ...incident, decryptionError: true };
    }
}

export async function downloadEvidence(incident) {
    const session = await auth.getSession();
    const passphrase = auth.getPassphrase();
    const userId = session.user.id;

    if (!incident.file_path) return;

    // 1. Download from Storage
    const { data, error } = await supabase.storage
        .from('evidence')
        .download(incident.file_path);

    if (error) throw error;

    // 2. Unpackage and Decrypt
    const arrayBuffer = await data.arrayBuffer();
    const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(arrayBuffer)));
    const { encryptedData, iv } = unpackageEncrypted(base64);
    
    const decryptedData = await decryptData(encryptedData, iv, passphrase, userId);

    // 3. Verify Integrity
    const isValid = await verifyIntegrity(decryptedData, incident.file_hash);
    if (!isValid) {
        throw new Error('INTEGRITY ERROR: File hash mismatch. The file may have been tampered with.');
    }

    // 4. Trigger Download
    const originalName = incident.file_path.split('_').slice(1).join('_').replace('.enc', '');
    const blob = new Blob([decryptedData]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function exportToPDF(incidents) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("ShieldHer - Incident Summary Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
    
    let y = 45;
    incidents.forEach((inc, index) => {
        if (inc.decryptionError) return;
        
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        
        doc.setFont("helvetica", "bold");
        doc.text(`Incident #${index + 1}`, 20, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.text(`Date: ${inc.decrypted.date}`, 20, y);
        y += 7;
        doc.text(`Location: ${inc.decrypted.location.lat}, ${inc.decrypted.location.lng}`, 20, y);
        y += 7;
        doc.text(`Description: ${inc.decrypted.description}`, 20, y, { maxWidth: 170 });
        y += 20;
    });
    
    doc.save("ShieldHer_Report.pdf");
}

export async function exportToZIP(incidents) {
    const zip = new JSZip();
    const session = await auth.getSession();
    const passphrase = auth.getPassphrase();
    const userId = session.user.id;

    const reportData = incidents.map((inc, i) => {
        if (inc.decryptionError) return `Incident #${i+1}: Decryption Failed`;
        return `Incident #${i+1}\nDate: ${inc.decrypted.date}\nLocation: ${inc.decrypted.location.lat}, ${inc.decrypted.location.lng}\nDescription: ${inc.decrypted.description}\nFile Hash: ${inc.file_hash || 'None'}\n------------------\n`;
    }).join('\n');

    zip.file("summary.txt", reportData);

    const evidenceFolder = zip.folder("evidence");

    for (const inc of incidents) {
        if (inc.file_path && !inc.decryptionError) {
            try {
                const { data } = await supabase.storage.from('evidence').download(inc.file_path);
                const arrayBuffer = await data.arrayBuffer();
                const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(arrayBuffer)));
                const { encryptedData, iv } = unpackageEncrypted(base64);
                const decryptedData = await decryptData(encryptedData, iv, passphrase, userId);
                
                const originalName = inc.file_path.split('_').slice(1).join('_').replace('.enc', '');
                evidenceFolder.file(originalName, decryptedData);
            } catch (e) {
                console.error("Failed to add file to ZIP:", inc.file_path, e);
            }
        }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = "ShieldHer_Vault_Export.zip";
    a.click();
    URL.revokeObjectURL(url);
}
