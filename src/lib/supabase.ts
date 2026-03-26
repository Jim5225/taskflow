import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabaseInstance: SupabaseClient | null = null;

if (supabaseConfigured) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn(
    '⚠️ Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Proxy that throws helpful errors if used without configuration
export const supabase: SupabaseClient = supabaseInstance || new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (prop === 'auth') {
      return {
        signInWithPassword: () => Promise.reject(new Error('Supabase not configured')),
        signUp: () => Promise.reject(new Error('Supabase not configured')),
        signOut: () => Promise.resolve({ error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      };
    }
    if (prop === 'from') {
      return () => ({
        select: () => ({ eq: () => ({ single: () => Promise.reject(new Error('Supabase not configured')), order: () => Promise.resolve({ data: [], error: null }) }), gte: () => ({}), lte: () => ({}) }),
        insert: () => ({ select: () => ({ single: () => Promise.reject(new Error('Supabase not configured')) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.reject(new Error('Supabase not configured')) }) }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      });
    }
    if (prop === 'channel') {
      return () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      });
    }
    return undefined;
  },
});
