const { readFileSync, existsSync } = require("fs");
const { resolve } = require("path");
const { Pool } = require("pg");

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

const PASSWORD = "1Y2y3y4y5y6y7y8y";
const REF = "irasmbfqhrrsdtmgpzrf";

async function tryConnect(config) {
  const pool = new Pool({ ...config, max: 1, connectionTimeoutMillis: 10000 });
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT 1 AS ok");
    client.release();
    return pool;
  } catch (e) {
    await pool.end();
    throw e;
  }
}

async function main() {
  const attempts = [];

  const baseHost = "aws-0-us-west-1.pooler.supabase.com";

  for (const user of [
    `postgres.${REF}`,
    `${REF}.postgres`,
    REF,
    `postgres:${REF}`,
    `${REF}:postgres`,
    `${REF}.pg`,
    `pg.${REF}`,
  ]) {
    for (const port of [6543, 6563]) {
      for (const db of ["postgres", REF, "supabase"]) {
        attempts.push({ host: baseHost, port, database: db, user, password: PASSWORD, ssl: { rejectUnauthorized: false } });
      }
    }
  }

  let pool = null;
  for (const cfg of attempts) {
    try {
      pool = await tryConnect(cfg);
      console.log(`Connected: ${cfg.user}@${cfg.host}:${cfg.port}/${cfg.database}`);
      break;
    } catch (e) {
      // silent
    }
  }

  if (!pool) {
    console.error("Could not connect via pooler with any combination.");

    // Try direct with custom TLS
    console.error("\nTrying direct with SSL SNI override...");
    const tls = require("tls");
    const net = require("net");
    try {
      const socket = new net.Socket();
      const tlsSocket = tls.connect({
        socket,
        host: "db.irasmbfqhrrsdtmgpzrf.supabase.co",
        servername: "db.irasmbfqhrrsdtmgpzrf.supabase.co",
        port: 5432,
        rejectUnauthorized: false,
      });
      await new Promise((resolve, reject) => {
        tlsSocket.once("secureConnect", () => { tlsSocket.end(); resolve(); });
        tlsSocket.once("error", reject);
      });
      // If we get here, TLS works but pg failed
      console.log("TLS to direct host succeeded!");
    } catch (e) {
      console.error("TLS to direct host failed:", e.message);
    }

    console.error("\nCannot connect to the database. Please run the SQL manually:");
    console.error("  Dashboard: https://supabase.com/dashboard/project/irasmbfqhrrsdtmgpzrf/sql/new");
    console.error("  SQL file: complete-migration.sql");
    process.exit(1);
  }

  const migrations = [
    "202604240001_initial_schema.sql",
    "202604240002_registration_drafts.sql",
    "202604240003_content_import_keys.sql",
    "202605060004_enable_rls.sql",
    "202606180005_simplify_questions.sql",
  ];

  for (const file of migrations) {
    const sql = readFileSync(resolve(projectDir, "supabase/migrations", file), "utf-8");
    console.log(`Running ${file}...`);
    await pool.query(sql);
    console.log(`  Done`);
  }

  const seedSql = readFileSync(resolve(projectDir, "supabase/seeds/001_admin_account.sql"), "utf-8");
  console.log("Running admin seed...");
  await pool.query(seedSql);
  console.log("  Done");

  await pool.end();
  console.log("\nAll migrations and seeds applied successfully!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
