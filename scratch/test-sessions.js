import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
  console.log('Testing User with UserSession query...');
  const { data, error } = await supabase
    .from('User')
    .select('id, email, UserSession(lastPing, endTime, startTime)')
    .order('lastPing', { foreignTable: 'UserSession', ascending: false })
    .limit(1, { foreignTable: 'UserSession' })
    .limit(5);
    
  if (error) {
    console.error('Error fetching users and sessions:', error);
  } else {
    console.log('Users found:', data?.length);
    console.log('Users data:', JSON.stringify(data, null, 2));
  }
}

testQuery();
