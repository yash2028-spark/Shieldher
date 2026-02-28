import { supabase } from './supabase.js';

export const auth = {
    async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        return data;
    },

    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },

    async signInWithGoogle() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dashboard.html',
                queryParams: {
                    prompt: 'select_account'
                }
            }
        });
        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        sessionStorage.removeItem('vault_key');
        if (error) throw error;
        window.location.href = '/index.html';
    },

    async getSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) return null;
        return session;
    }
};

export async function checkAuth() {
    const session = await auth.getSession();
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname === '/';
    
    if (!session && !isLoginPage) {
        window.location.href = '/index.html';
    } else if (session && isLoginPage) {
        window.location.href = '/dashboard.html';
    }
    return session;
}
