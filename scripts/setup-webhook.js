const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = (process.env.NEXT_PUBLIC_MINI_APP_URL || "https://aviation-cyan.vercel.app").replace(/\/+$/, "");
const WEBHOOK_URL = `${BASE_URL}/api/telegram/webhook`;
const REQUIRED_UPDATES = ["message", "callback_query", "edited_message"];

if (!BOT_TOKEN) {
  console.error("ERROR: TELEGRAM_BOT_TOKEN is not set in environment or .env file.");
  process.exit(1);
}

async function main() {
  console.log("Checking current Telegram webhook configuration...");
  const infoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
  const info = await infoRes.json();
  console.log("Current Webhook Info:", JSON.stringify(info.result, null, 2));

  console.log(`\nRegistering webhook: ${WEBHOOK_URL}`);
  console.log("Allowed updates:", REQUIRED_UPDATES);

  const setRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      allowed_updates: REQUIRED_UPDATES,
      drop_pending_updates: false,
    }),
  });

  const setResult = await setRes.json();
  console.log("\nsetWebhook result:", setResult);

  if (!setResult.ok) {
    console.error("FAILED to register webhook with Telegram API!");
    process.exit(1);
  }

  const verifyRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
  const verify = await verifyRes.json();
  console.log("\nVerified Webhook Info:", JSON.stringify(verify.result, null, 2));

  const hasCallbacks = verify.result.allowed_updates.includes("callback_query");
  const hasMessages = verify.result.allowed_updates.includes("message");

  if (verify.result.url === WEBHOOK_URL && hasCallbacks && hasMessages) {
    console.log("\nSUCCESS: Telegram webhook is healthy and fully configured for both messages and buttons!");
  } else {
    console.warn("\nWARNING: Webhook registered, but allowed_updates may be missing expected types.");
  }
}

main().catch(console.error);
