// ============================================================
// MBSI Library — Admin Telegram notifier (server only)
// ============================================================
// Token VA chat ID faqat env o'zgaruvchilardan olinadi:
//   TELEGRAM_BOT_TOKEN    — BotFather dan olingan token
//   TELEGRAM_ADMIN_CHAT_ID — admin xabar oladigan chat ID
// Sozlanmagan bo'lsa — jim turadi (throw qilmaydi).
// ============================================================

function getConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();
  if (!token || !chatId) return null;
  return { token, chatId };
}

export function isTelegramConfigured(): boolean {
  return getConfig() !== null;
}

async function send(text: string): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg) return false;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${cfg.token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: cfg.chatId,
          text,
          parse_mode: "HTML",
        }),
      }
    );
    return res.ok;
  } catch (e) {
    console.error("Telegram notify failed:", e);
    return false;
  }
}

// ─── Event helpers (fire-and-forget) ────────────────────────

export function notifyNewStudent(name: string, email: string, group: string) {
  void send(
    `📢 <b>YANGI O'QUVCHI</b>\n👤 Ism: ${name}\n📧 Email: ${email || "—"}\n🏫 Guruh: ${group || "—"}`
  );
}

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
