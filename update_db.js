process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const password = '1Y2y3y4y5y6y7y8y';
const user = 'postgres.irasmbfqhrrsdtmgpzrf';
const host = 'aws-0-eu-west-1.pooler.supabase.com';
const url = `postgresql://${user}:${password}@${host}:6543/postgres?sslmode=require`;

async function updateDb() {
  const client = new Client({ 
    connectionString: url, 
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    await client.query(`
      ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS set_name TEXT DEFAULT 'Note 1';
    `);
    console.log('✅ Column set_name added to notes table');
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

updateDb();
