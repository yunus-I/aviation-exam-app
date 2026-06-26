import { readFileSync } from "fs";
import { resolve } from "path";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const { getSupabaseAdminClient } = await import("../src/lib/supabase/admin");

  const supabase = getSupabaseAdminClient();

  const sql = readFileSync(
    resolve(projectDir, "supabase/migrations/202606180005_simplify_questions.sql"),
    "utf-8",
  );

  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    const { error } = await supabase.rpc("exec_sql" as any, { sql: stmt + ";" } as any);
    if (error) {
      // exec_sql might not exist — try direct query
      const { error: directError } = await supabase.from("_dummy").select("*").neq("id", "none").limit(0);
      // fallback: just run via raw query
      if (directError) {
        console.log("Could not run via RPC, connecting directly...");
      }
    }
  }

  // Fallback: run via raw SQL query
  const { error } = await supabase.from("_sql_migration").insert({ sql } as any).single().maybeSingle();
  if (error && error.code !== "PGRST116") {
    console.log("Direct run approach:", error.message);
  }

  console.log("Migration SQL to execute:");
  console.log(sql);
  console.log("\nCopy the SQL above and paste it in the Supabase Dashboard SQL editor.");
  console.log("Dashboard URL: https://supabase.com/dashboard/project/irasmbfqhrrsdtmgpzrf/sql/new");
}

main().catch(console.error);
