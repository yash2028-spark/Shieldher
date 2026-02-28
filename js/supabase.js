import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = "https://cvxyotssonnxbodqhayy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_UPyEfw_m7EEyolj2p6QgSA_EhYUGdgO";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
