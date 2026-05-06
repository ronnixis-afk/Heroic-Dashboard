import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
  console.log('Testing UsageLog query...');
  const { data, error } = await supabase
    .from('UsageLog')
    .select('*, User(email)');
    
  if (error) {
    console.error('Error fetching logs:', error);
  } else {
    console.log('Logs found:', data?.length);
    if (data && data.length > 0) {
      console.log('First log:', JSON.stringify(data[0], null, 2));
    }
  }
}

testQuery();
