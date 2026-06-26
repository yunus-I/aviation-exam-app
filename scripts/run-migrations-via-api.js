const { readFileSync, existsSync } = require("fs");
const { resolve } = require("path");

const projectDir = process.cwd();
const envPath = resolve(projectDir, ".env");
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  // Step 1: Create the exec_sql function via the Management API
  // Since we can't run DDL directly through REST, we'll use the 
  // Supabase JS client to create a function via dashboard or try via API
  
  // Try using the supabase-js client to run SQL through rpc
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Read and combine all SQL
  const migrations = [
    "supabase/migrations/202604240001_initial_schema.sql",
    "supabase/migrations/202604240002_registration_drafts.sql",
    "supabase/migrations/202604240003_content_import_keys.sql",
    "supabase/migrations/202605060004_enable_rls.sql",
    "supabase/migrations/202606180005_simplify_questions.sql",
  ];

  let combinedSql = "";
  for (const m of migrations) {
    combinedSql += readFileSync(resolve(projectDir, m), "utf-8") + "\n";
  }
  combinedSql += readFileSync(resolve(projectDir, "supabase/seeds/001_admin_account.sql"), "utf-8");

  // Write combined SQL to a file and open Supabase dashboard
  const outPath = resolve(projectDir, "run-this-in-supabase.sql");
  const fs = require("fs");
  fs.writeFileSync(outPath, combinedSql);
  
  console.log("==============================================");
  console.log("Cannot run DDL through REST API from this network.");
  console.log("A combined SQL file has been written to:");
  console.log("  " + outPath);
  console.log("");
  console.log("Please paste it into the Supabase SQL editor:");
  console.log("  https://supabase.com/dashboard/project/irasmbfqhrrsdtmgpzrf/sql/new");
  console.log("==============================================");
}

run().catch(console.error);
