import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from Heroic Dashboard
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function investigate() {
  let allLogs: any[] = [];
  let from = 0;
  const PAGE_SIZE = 1000;

  console.log('Fetching all logs from Supabase...');

  try {
      while (true) {
          const { data, error, count } = await supabase
            .from('UsageLog')
            .select('tokens, inputTokens, outputTokens, costUsd, createdAt', { count: 'exact' })
            .order('createdAt', { ascending: false })
            .range(from, from + PAGE_SIZE - 1);

          if (error) throw error;
          if (!data || data.length === 0) break;
          allLogs = [...allLogs, ...data];
          if (data.length < PAGE_SIZE || (count !== null && allLogs.length >= count)) break;
          from += PAGE_SIZE;
          if (from >= 100000) break;
      }
  } catch (err) {
      console.error('Error fetching logs:', err);
      return;
  }

  let totalTokens = 0;
  let totalCostFromDb = 0;
  let totalCostRecalculated = 0;
  let logsWithZeroCost = 0;
  let logsWithCost = 0;

  allLogs.forEach(log => {
    totalTokens += Number(log.tokens) || 0;
    totalCostFromDb += Number(log.costUsd) || 0;
    
    if (Number(log.costUsd) > 0) {
      logsWithCost++;
    } else {
      logsWithZeroCost++;
    }

    // Recalculate using the standard rate
    const inT = Number(log.inputTokens) || 0;
    const outT = Number(log.outputTokens) || 0;
    const totalT = Number(log.tokens) || (inT + outT);
    
    let cost = 0;
    if (inT > 0 || outT > 0) {
      cost = (inT * 0.00000025) + (outT * 0.0000015);
    } else {
      cost = totalT * 0.0000006;
    }
    totalCostRecalculated += cost;
  });

  console.log('--- Investigation Report ---');
  console.log(`Total Logs Found: ${allLogs.length}`);
  console.log(`Logs with costUsd > 0: ${logsWithCost}`);
  console.log(`Logs with costUsd == 0 or NULL: ${logsWithZeroCost}`);
  console.log(`Total Tokens: ${totalTokens.toLocaleString()}`);
  console.log(`Total Cost (Sum of costUsd): $${totalCostFromDb.toFixed(6)}`);
  console.log(`Total Cost (Recalculated): $${totalCostRecalculated.toFixed(6)}`);
  console.log('---------------------------');
}

investigate();
