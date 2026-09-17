// ============================================================
// MBSI Library — Telegram Webhook Handler
// ============================================================
// POST /api/telegram — receives Telegram updates
// ============================================================

import { NextRequest } from "next/server";
import { bot } from "@/bot";

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    if (WEBHOOK_SECRET) {
      const token = req.headers.get("x-telegram-bot-api-secret-token");
      if (token !== WEBHOOK_SECRET) {
        return new Response("Forbidden", { status: 403 });
      }
    }
    // grammy needs botInfo before handling updates in serverless
    // environments — init() fetches it once and caches it.
    await bot.init();
    const body = await req.json();
    await bot.handleUpdate(body);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return new Response("Error", { status: 500 });
  }
}
