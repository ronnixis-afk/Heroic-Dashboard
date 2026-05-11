import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listAllViews() {
  console.log('Listing all views...');
  // Note: Supabase JS doesn't allow querying information_schema directly via .from() usually
  // unless explicitly allowed. We'll try a common RPC if it exists or just try common names.
  
  // Alternative: Try to call a function that might list them, or just use the Hint from before.
  // Hint said: Perhaps you meant 'public.feature_usage_distribution'
  
  const names = [
    'active_users_by_tier',
    'user_tier_distribution',
    'daily_usage_summary',
    'monthly_usage_summary',
    'top_consumers_summary',
    'model_usage_distribution',
    'feature_usage_distribution',
    'session_metrics_summary',
    'real_time_hourly_stats'
  ];

  for (const name of names) {
    const { error } = await supabase.from(name).select('*').limit(0);
    if (!error) console.log(`[V] ${name}`);
    else if (error.code !== 'PGRST205') console.log(`[?] ${name}: ${error.message} (${error.code})`);
  }
}

listAllViews();
