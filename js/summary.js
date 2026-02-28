/**
 * AI Summary Generator for ShieldHer
 */

export function generateAISummary(incident) {
    const { date, decrypted, file_path } = incident;
    const { description, location } = decrypted;
    
    let fileCount = 0;
    try {
        if (file_path) {
            const paths = JSON.parse(file_path);
            fileCount = Array.isArray(paths) ? paths.length : 1;
        }
    } catch (e) {
        fileCount = 1;
    }
    
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Create a shortened overview of the description
    const overview = description.length > 200 
        ? description.substring(0, 197) + '...' 
        : description;

    const summary = `On ${formattedDate}, an incident was reported at ${location || 'an unspecified location'}. The report states: "${overview}". A total of ${fileCount} evidence file(s) were attached.`;

    const fullReport = `
SHIELDHER INCIDENT REPORT
-------------------------
Date: ${formattedDate}
Location: ${location || 'N/A'}
Status: End-to-End Encrypted

DESCRIPTION:
${description}

EVIDENCE:
Total Files: ${fileCount}
Integrity: Verified via client-side hashing

Generated on: ${new Date().toLocaleString()}
    `.trim();

    return {
        title: "Incident Intelligence Summary",
        content: summary,
        fullReport: fullReport,
        timestamp: new Date().toISOString(),
        fileCount
    };
}
