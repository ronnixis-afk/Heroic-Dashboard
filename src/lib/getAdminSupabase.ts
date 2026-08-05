import { getSupabaseClient } from './supabase';

export async function getAdminSupabase(getToken: (options?: any) => Promise<string | null>) {
  const token = await getToken({ template: 'supabase' });
  if (!token) {
    throw new Error('Admin Session Expired. Please Sign In Again.');
  }
  return getSupabaseClient(token);
}
