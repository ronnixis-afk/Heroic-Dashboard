import { getSupabaseClient } from './src/lib/supabase';

async function testConnection() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('get_dashboard_stats');
  console.log('RPC Test (Anonymous):', { data, error });

  const { data: logs, error: logsError } = await supabase.from('UsageLog').select('*').limit(5);
  console.log('Logs Test (Anonymous):', { logs, logsError });
}

testConnection();
