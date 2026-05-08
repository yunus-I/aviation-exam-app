import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const client = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Supabase URL:", url);

  const tables = ["admin_accounts", "candidates", "registration_submissions", "topics"];

  for (const table of tables) {
    const res = await client.from(table).select("id").limit(1);
    console.log(`\nTable: ${table}`);
    console.log("  error:", res.error ? JSON.stringify(res.error) : null);
    console.log("  data:", res.data ? JSON.stringify(res.data) : null);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
