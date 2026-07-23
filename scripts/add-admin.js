const { createClient } = require("@supabase/supabase-js");
const { readFileSync, existsSync } = require("fs");
const { resolve } = require("path");

const envPath = resolve(process.cwd(), ".env.local");
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
  const adminData = {
    telegram_user_id: 2137659946,
    telegram_username: "Yeabsra_Niguse",
    display_name: "Yeabsra Niguse",
    is_super_admin: true,
    is_active: true
  };

  const { data, error } = await supabase
    .from("admin_accounts")
    .upsert(adminData, { onConflict: "telegram_user_id" })
    .select();

  if (error) {
    console.error("Error inserting admin:", error);
  } else {
    console.log("Admin account successfully created/updated:", data);
  }
}

main().catch(console.error);
