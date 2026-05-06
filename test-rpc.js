import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRPC() {
  console.log('Testing get_dashboard_stats RPC...');
  const { data, error } = await supabase.rpc('get_dashboard_stats');
    
  if (error) {
    console.error('Error calling RPC:', error);
  } else {
    console.log('RPC Data:', JSON.stringify(data, null, 2));
  }
}

testRPC();
