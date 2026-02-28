import { supabase } from './supabase.js';

export async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    return { data, error };
}

export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
}

export async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/dashboard.html'
        }
    });
    return { data, error };
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    sessionStorage.removeItem('vault_key');
    window.location.href = 'login.html';
    return { error };
}

export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

export function checkAuth() {
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
            window.location.href = 'login.html';
        }
    });
}
