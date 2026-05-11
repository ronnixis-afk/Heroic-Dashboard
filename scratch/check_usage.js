import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsage() {
  console.log('Checking UsageLog table...');
  const { count, error } = await supabase.from('UsageLog').select('*', { count: 'exact', head: true });
  if (error) console.error('Error:', error);
  else console.log('Total Usage Logs:', count);
}

checkUsage();
