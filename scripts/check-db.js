const { createClient } = require("@supabase/supabase-js");
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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Check admin accounts
  const admins = await supabase.from("admin_accounts").select("*");
  console.log("Admins:", JSON.stringify(admins.data, null, 2), admins.error);

  // Check departments
  const depts = await supabase.from("departments").select("code");
  console.log("Departments:", JSON.stringify(depts.data, null, 2));

  // Check topics
  const topics = await supabase.from("topics").select("slug");
  console.log("Topics:", JSON.stringify(topics.data, null, 2));

  // Check if questions table exists and has no difficulty_level
  const q = await supabase.from("questions").select("id").limit(1);
  console.log("Questions query:", q.error?.message ?? "Table exists, " + (q.data?.length ?? 0) + " rows");
}

main().catch(console.error);
