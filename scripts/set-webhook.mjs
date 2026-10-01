// ============================================================
// MBSI Library — Set Telegram Webhook
// ============================================================
// Run: node scripts/set-webhook.mjs
// ============================================================

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually
function loadEnv() {
  try {
    const envPath = resolve(__dirname, "../.env");
    const content = readFileSync(envPath, "utf-8");
    const env = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.APP_URL || env.APP_URL || "http://localhost:3000";

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN not found in .env");
  process.exit(1);
}

const webhookUrl = `${APP_URL}/api/telegram`;

console.log(`🔗 Setting webhook to: ${webhookUrl}`);

const res = await fetch(
  `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
    }),
  }
);

const data = await res.json();

if (data.ok) {
  console.log("✅ Webhook set successfully!");
  console.log(`   URL: ${webhookUrl}`);
} else {
  console.error("❌ Failed to set webhook:", data);
}

// Also check current webhook
const checkRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
const checkData = await checkRes.json();
if (checkData.ok) {
  console.log("\n📋 Current webhook info:");
  console.log(`   URL: ${checkData.result.url || "None"}`);
  console.log(`   Pending updates: ${checkData.result.pending_update_count}`);
  if (checkData.result.last_error_message) {
    console.log(`   Last error: ${checkData.result.last_error_message}`);
  }
}
