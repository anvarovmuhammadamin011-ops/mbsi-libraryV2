// ============================================================
// MBSI Library — Admin Telegram notifier (server only)
// ============================================================
// Token VA chat ID faqat env o'zgaruvchilardan olinadi:
//   TELEGRAM_BOT_TOKEN    — BotFather dan olingan token
//   TELEGRAM_ADMIN_CHAT_ID — admin xabar oladigan chat ID
//   (bo'lmasa bazadagi ADMIN foydalanuvchining telegramId si ishlatiladi)
// Sozlanmagan bo'lsa — jim turadi (throw qilmaydi).
// ============================================================

import { prisma } from "@/lib/db";

const API_BASE = "https://api.telegram.org";

// chatId: env'dan, bo'lmasa bazadagi ADMIN foydalanuvchining telegramId si
let cachedAdminChatId: string | null | undefined;

async function resolveAdminChatId(): Promise<string | null> {
  const envChatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();
  if (envChatId) return envChatId;
  if (cachedAdminChatId !== undefined) return cachedAdminChatId;
  try {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN", telegramId: { not: null } },
      orderBy: { createdAt: "asc" },
    });
    cachedAdminChatId = admin?.telegramId ?? null;
  } catch {
    cachedAdminChatId = null;
  }
  return cachedAdminChatId;
}

function getConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return null;
  return { token };
}

export function isTelegramConfigured(): boolean {
  return getConfig() !== null;
}

async function callApi(
  method: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg) return false;
  try {
    const res = await fetch(`${API_BASE}/bot${cfg.token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.error("Telegram API call failed:", e);
    return false;
  }
}

async function send(text: string): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg) return false;
  const chatId = await resolveAdminChatId();
  if (!chatId) return false;
  return callApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  });
}

// ─── Yangi o'quvchi arizasi (inline ✅/❌ tugmalar bilan) ────
export async function notifyNewStudentRequest(request: {
  id: string;
  firstName: string;
  lastName: string;
  group?: string | null;
  age?: number | null;
  phone?: string | null;
  submittedByName?: string | null;
}): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg) return false;
  const chatId = await resolveAdminChatId();
  if (!chatId) return false;
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const time = new Date().toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const text =
    `🆕 <b>Yangi o'quvchi qo'shildi</b>\n` +
    `👤 Ism: ${esc(request.firstName)}\n` +
    `👤 Familiya: ${esc(request.lastName)}\n` +
    `🎓 Guruh: ${esc(request.group || "—")}\n` +
    `🎂 Yosh: ${request.age ?? "—"}\n` +
    (request.phone ? `📞 Tel: ${esc(request.phone)}\n` : "") +
    (request.submittedByName
      ? `📝 Yubordi: ${esc(request.submittedByName)}\n`
      : "") +
    `🕐 Vaqt: ${time}\n\n` +
    `O'quvchini tizimga qo'shishni tasdiqlaysizmi?`;
  return callApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Qo'shish", callback_data: `st_ap_${request.id}` },
          { text: "❌ Rad etish", callback_data: `st_rj_${request.id}` },
        ],
      ],
    },
  });
}

// Ariza holatini Telegram xabarida yangilash (tugmalarni olib tashlaydi)
export async function notifyRequestDecided(
  telegramMessageId: number | undefined,
  summary: string,
  approved: boolean
): Promise<void> {
  const cfg = getConfig();
  if (!cfg) return;
  const chatId = await resolveAdminChatId();
  if (!chatId) return;
  const base = approved ? "✅ <b>Tasdiqlandi</b>" : "❌ <b>Rad etildi</b>";
  const text = `${base}\n${summary}`;
  if (telegramMessageId) {
    const ok = await callApi("editMessageText", {
      chat_id: chatId,
      message_id: telegramMessageId,
      text,
      parse_mode: "HTML",
    });
    if (ok) return;
  }
  await send(text);
}

// ─── Oddiy event xabarlari (fire-and-forget) ────────────────

export function notifyNewBook(title: string, author: string, category: string) {
  void send(
    `📚 <b>YANGI KITOB</b>\n📖 Nomi: ${title}\n✍️ Muallif: ${author}\n📁 Kategoriya: ${category}`
  );
}

export function notifyNewCategory(name: string) {
  void send(`🏷️ <b>YANGI KATEGORIYA</b>\n💬 Nomi: ${name}`);
}

export function notifyAlert(problem: string) {
  void send(`⚠️ <b>XAVF:</b> ${problem}`);
}

export async function sendTestMessage(): Promise<boolean> {
  return send("✅ <b>MBSI Library</b> — Telegram bildirishnomalar ishlayapti.");
}
