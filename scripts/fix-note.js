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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  // Update the row
  const { data, error } = await supabase
    .from('notes')
    .update({ dept: 'cabin', set_name: 'Note 1' })
    .eq('title', 'Cabin Crew Note 1');
  
  if (error) {
    console.log("Error with set_name:", error.message);
    // if set_name doesn't exist, just update dept
    const { data: d2, error: e2 } = await supabase
      .from('notes')
      .update({ dept: 'cabin' })
      .eq('title', 'Cabin Crew Note 1');
    if (e2) console.error("Error updating dept:", e2);
    else console.log("Updated dept to lowercase 'cabin' without set_name");
  } else {
    console.log("Successfully updated dept to 'cabin' and set_name to 'Note 1'");
  }
}

main();
