import https from "https";

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT = "irasmbfqhrrsdtmgpzrf";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!TOKEN) {
  console.error("Missing SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "api.supabase.com",
      path: `/v1/projects/${PROJECT}${path}`,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        } else {
          reject(new Error(`${res.statusCode}: ${data}`));
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const SERVICE_KEY = SUPABASE_SERVICE_ROLE_KEY;

  console.log("1. Creating Supabase Auth user...");
  const user = await new Promise((resolve, reject) => {
    const opts = {
      hostname: "irasmbfqhrrsdtmgpzrf.supabase.co",
      path: "/auth/v1/admin/users",
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        "Content-Type": "application/json",
      },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode < 300) resolve(JSON.parse(data));
        else reject(new Error(`${res.statusCode}: ${data}`));
      });
    });
    req.on("error", reject);
    req.write(JSON.stringify({ email: "yunuschatgpt@gmail.com", password: "00000", email_confirm: true }));
    req.end();
  });
  console.log("   Created:", user.id);

  console.log("2. Linking email to admin_accounts...");
  await api("POST", "/database/query", {
    query:
      "update public.admin_accounts set email = 'yunuschatgpt@gmail.com' where telegram_user_id = 5827966050;",
  });
  console.log("   OK");

  console.log("3. Verifying...");
  const result = await api("POST", "/database/query", {
    query:
      "select id, telegram_username, email, is_super_admin from public.admin_accounts where email = 'yunuschatgpt@gmail.com';",
  });
  console.log("   Result:", JSON.stringify(result, null, 2));

  console.log("\nDone! You can now sign in at /admin/login");
  console.log("   Email: yunuschatgpt@gmail.com");
  console.log("   Password: 00000");
}

main().catch((e) => console.error("FAILED:", e.message));
