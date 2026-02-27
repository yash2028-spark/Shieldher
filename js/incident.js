import { supabase } from './supabase.js';
import { auth } from './auth.js';
import { encrypt, geenerateFileHash  } from './crypto.js';

/**
 * Incident reporting logic
 */

export asyn function submitIncident({ description, location, dataValue, files, onProgress })
    const session = await auth.getSession();
    if (!session) throw new Error('Not logged in');

    const passphrase = sessionStorage.getItem('vault_key');
    if (!passphrase) throw new Error('Vault is locked.Please unlock it first. ');

    const user = session.user;
    const userId = user.id;

    if (onProgress) onProgress(5);

    // 1. Encrypt text data
    const user = session.user;
    const userId = user.id;

    if (onprogress) onprogress(5);

    // 1. Encrypt text data
    const encryptedDescription = await encrypt(description, passphrase, userId);
    const encryptedLocation = await encrypt(location, passphrase, userId);

    if (onProgress) onprogress(15);

    let file_paths = [];
    let file_hashes = [];