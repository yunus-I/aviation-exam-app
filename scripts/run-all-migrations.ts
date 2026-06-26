import { readFileSync } from "fs";
import { resolve } from "path";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const { default: { Pool } } = await import("pg");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const migrations = [
    "202604240001_initial_schema.sql",
    "202604240002_registration_drafts.sql",
    "202604240003_content_import_keys.sql",
    "202605060004_enable_rls.sql",
    "202606180005_simplify_questions.sql",
  ];

  for (const file of migrations) {
    const sql = readFileSync(
      resolve(projectDir, "supabase/migrations", file),
      "utf-8",
    );
    console.log(`Running ${file}...`);
    await pool.query(sql);
    console.log(`  ✅ ${file} done`);
  }

  // Seed admin
  const seedSql = readFileSync(
    resolve(projectDir, "supabase/seeds/001_admin_account.sql"),
    "utf-8",
  );
  console.log("Running admin seed...");
  await pool.query(seedSql);
  console.log("  ✅ admin seed done");

  await pool.end();
  console.log("\nAll migrations and seeds applied successfully!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
