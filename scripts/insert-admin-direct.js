const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:1Y2y3y4y5y6y7y8y@db.irasmbfqhrrsdtmgpzrf.supabase.co:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log("Connected directly to Supabase PostgreSQL database!");
    
    const res = await client.query(`
      INSERT INTO public.admin_accounts (telegram_user_id, display_name, is_super_admin, is_active)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (telegram_user_id) DO UPDATE SET is_active = true
      RETURNING id;
    `, [5827966050, 'Yunus', true, true]);
    
    console.log("Admin successfully added to the database! Admin ID:", res.rows[0].id);
  } catch (error) {
    console.error("Database Error:", error);
  } finally {
    await client.end();
  }
}

run();
