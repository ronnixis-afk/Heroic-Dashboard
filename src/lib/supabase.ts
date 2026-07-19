/**
 * SUPABASE CLIENT CONFIGURATION
 *
 * Browser Supabase client (anon key). Analytics / PII views are NOT readable via
 * anon or authenticated PostgREST — use Clerk-gated RPG admin APIs
 * (`fetchRpgAdmin` → `/api/admin/analytics/*`) instead.
 *
 * Remaining direct Supabase usage is limited to non-analytics tables that still
 * have intentional RLS (e.g. User list, News, ImageAsset, Feedback).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing in .env file');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

/** Reuse authenticated clients by access token to avoid socket/connection churn. */
const authenticatedClients = new Map<string, SupabaseClient>();
const MAX_CACHED_CLIENTS = 4;

/**
 * Creates or reuses a Supabase client with a custom access token (e.g. from Clerk).
 * This is used to bypass RLS or use specific user permissions.
 */
export const getSupabaseClient = (accessToken?: string) => {
  if (!accessToken) return supabase;

  const cached = authenticatedClients.get(accessToken);
  if (cached) return cached;

  const client = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  if (authenticatedClients.size >= MAX_CACHED_CLIENTS) {
    const oldestKey = authenticatedClients.keys().next().value;
    if (oldestKey) authenticatedClients.delete(oldestKey);
  }
  authenticatedClients.set(accessToken, client);
  return client;
};
