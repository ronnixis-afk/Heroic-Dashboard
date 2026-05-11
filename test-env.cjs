const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Connecting to:', supabaseUrl);
  const { data, error } = await supabase.rpc('get_dashboard_stats');
  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC Success! Data found.');
    console.log('Total Users:', data.totalUsers);
  }

  const { data: logs, error: logsError } = await supabase.from('UsageLog').select('id').limit(5);
  if (logsError) {
    console.error('Logs Error:', logsError);
  } else {
    console.log('Logs Success! Found:', logs.length);
  }
}

test();
