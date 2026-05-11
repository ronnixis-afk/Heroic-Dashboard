import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugUser() {
  console.log('Querying User table...');
  const { data, error } = await supabase.from('User').select('*');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('User data found:', data);
  }
}

debugUser();
