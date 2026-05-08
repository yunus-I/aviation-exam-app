import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(process.cwd(), ".env.local");
const envFile = fs.readFileSync(envPath, "utf8");
envFile.split(/\r?\n/).forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
});

async function main() {
  const { getSupabaseAdminClient } = await import("../src/lib/supabase/admin");
  const client = getSupabaseAdminClient();
  const bucketName = "registration-receipts";
  const { data, error } = await client.storage.createBucket(bucketName, {
    public: false,
  });
  console.log(JSON.stringify({ bucketName, data, error }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
