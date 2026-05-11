import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
  console.log('Checking User table...');
  const { count, error: countError } = await supabase.from('User').select('*', { count: 'exact', head: true });
  if (countError) console.error('Count Error:', countError);
  else console.log('Total Users:', count);

  console.log('Checking user_tier_distribution columns...');
  const { data, error: tierError } = await supabase.from('user_tier_distribution').select('*').limit(1);
  if (tierError) console.error('Tier Error:', tierError);
  else {
    console.log('Tier Distribution Columns:', data.length > 0 ? Object.keys(data[0]) : 'No data to check columns');
  }
}

checkUsers();
