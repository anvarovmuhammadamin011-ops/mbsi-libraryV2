// ============================================================
// MBSI Library — Telegram Webhook Handler
// ============================================================
// POST /api/telegram — receives Telegram updates
// ============================================================

import { NextRequest } from "next/server";
import { bot } from "@/bot";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    //grammY expects the update object directly
    await bot.handleUpdate(body);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return new Response("Error", { status: 500 });
  }
}
