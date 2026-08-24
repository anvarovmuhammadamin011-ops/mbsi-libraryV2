// ============================================================
// MBSI Library — Telegram Bot (Polling Mode)
// ============================================================
// Usage: npm run bot:polling
// For development — uses long polling instead of webhook
// ============================================================

import { bot } from "./index";

console.log("🤖 MBSI Library Bot — Polling Mode");
console.log("   Press Ctrl+C to stop\n");

// Start polling
bot.start({
  onStart: (botInfo) => {
    console.log(`✅ Bot @${botInfo.username} is running!`);
    console.log(`   Token: ...${process.env.TELEGRAM_BOT_TOKEN?.slice(-8)}`);
    console.log("\n   Send /start to the bot in Telegram to test.\n");
  },
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Stopping bot...");
  bot.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  bot.stop();
  process.exit(0);
});
