import { auth, checkAuth } from './auth.js';
import { supabase } from './supabase.js';

async function init() {
    const session = await checkAuth();
    if (!session) return;

    const user = session.user;
    const profile = user.user_metadata;

    // Update Profile UI
    document.getElementById('userName').textContent = profile.full_name || 'ShieldHer User';
    document.getElementById('userEmail').textContent = user.email;
    if (profile.avatar_url) {
        document.getElementById('userAvatar').src = profile.avatar_url;
    }

    // Fetch Stats & Recent Incidents
    fetchDashboardData(user.id);

    // Logout
    document.getElementById('btnLogout').onclick = () => auth.signOut();
}

async function fetchDashboardData(userId) {
    try {
        // Get total count
        const { count, error: countError } = await supabase
            .from('incidents')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (countError) throw countError;
        document.getElementById('totalIncidents').textContent = count || 0;

        // Get recent 5
        const { data: recent, error: recentError } = await supabase
            .from('incidents')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentError) throw recentError;
        renderRecentIncidents(recent);

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
}

function renderRecentIncidents(incidents) {
    const container = document.getElementById('recentIncidents');
    if (!incidents || incidents.length === 0) {
        container.innerHTML = '<p class="text-zinc-600 italic text-sm">No recent incidents found.</p>';
        return;
    }

    container.innerHTML = incidents.map(inc => `
        <div class="flex items-center justify-between p-4 border border-zinc-900 rounded-xl hover:bg-zinc-900/30 transition-colors">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500">
                    📄
                </div>
                <div>
                    <p class="text-sm font-bold">${new Date(inc.date).toLocaleDateString()}</p>
                    <p class="text-xs text-zinc-500">${inc.location || 'No location'}</p>
                </div>
            </div>
            <div class="text-right">
                <span class="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded uppercase tracking-widest font-bold">Encrypted</span>
            </div>
        </div>
    `).join('');
}

init();
