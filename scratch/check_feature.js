import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkFeature() {
  console.log('Checking feature_usage_distribution...');
  const { data, error } = await supabase.from('feature_usage_distribution').select('*').limit(5);
  if (error) console.error('Error:', error);
  else console.log('Data:', data);
}

checkFeature();
