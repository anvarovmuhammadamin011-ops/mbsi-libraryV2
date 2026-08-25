// ============================================================
// MBSI Library — Telegram Webhook Handler
// ============================================================
// POST /api/telegram — receives Telegram updates
// ============================================================

import { NextRequest } from "next/server";
import { bot } from "@/bot";

export async function POST(req: NextRequest) {
  try {
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
