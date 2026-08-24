// ============================================================
// MBSI Library — Telegram Bot
// ============================================================
// Token: from .env (TELEGRAM_BOT_TOKEN)
// Usage: npm run bot (dev) or node dist/bot/index.js (prod)
// ============================================================

import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { prisma } from "../lib/db";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const MINI_APP_URL = process.env.MINI_APP_URL || APP_URL;

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN is not set in .env");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// ─── Helpers ────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function getUserByTelegramId(telegramId: number) {
  return prisma.user.findFirst({
    where: { telegramId: String(telegramId) },
  });
}

// ─── /start ─────────────────────────────────────────────────

bot.command("start", async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = await getUserByTelegramId(telegramId);

  const keyboard = new InlineKeyboard();

  if (user) {
    // Logged in — show main menu
    keyboard
      .text("📚 Kutubxona", "menu_books")
      .text("🔍 Qidirish", "menu_search")
      .row()
      .text("📖 Davom ettirish", "menu_continue")
      .text("🎯 Missiyalar", "menu_missions")
      .row()
      .text("🏆 Reyting", "menu_ranking")
      .text("🪙 Coinlarim", "menu_coins")
      .row()
      .text("📊 Statistikam", "menu_stats")
      .text("👤 Profil", "menu_profile")
      .row()
      .url("🌐 Kutubxonani ochish", MINI_APP_URL);

    await ctx.reply(
      `📚 <b>Assalomu alaykum, ${escapeHtml(user.name)}!</b>\n\n` +
        `MBSI Library ga xush kelibsiz. Quyidagi amallardan birini tanlang:`,
      {
        parse_mode: "HTML",
        reply_markup: keyboard,
      }
    );
  } else {
    // Not logged in — show login options
    keyboard
      .text("👨‍🎓 O'quvchi sifatida kirish", "login_STUDENT")
      .row()
      .text("👨‍🏫 O'qituvchi sifatida kirish", "login_TEACHER")
      .row()
      .url("🌐 Web'dan kirish", MINI_APP_URL);

    await ctx.reply(
      `📚 <b>MBSI Library</b>\n\n` +
        `O'quvchi kutubxonasi platformasiga xush kelibsiz!\n\n` +
        `Telegram hisobingiz orqali kirish uchun role tanlang:`,
      {
        parse_mode: "HTML",
        reply_markup: keyboard,
      }
    );
  }
});

// ─── Login callbacks ────────────────────────────────────────

bot.callbackQuery(/^login_(.+)$/, async (ctx) => {
  const role = ctx.match[1];
  const telegramId = ctx.from.id;

  // Check if user exists with this role
  let user = await prisma.user.findFirst({
    where: { role: role as any, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    await ctx.answerCallbackQuery({ text: "Foydalanuvchi topilmadi", show_alert: true });
    return;
  }

  // Link telegram ID to user
  await prisma.user.update({
    where: { id: user.id },
    data: { telegramId: String(telegramId) },
  });

  await ctx.answerCallbackQuery({ text: "✅ muvaffaqiyatli kirildi!" });

  // Show main menu
  const keyboard = new InlineKeyboard()
    .text("📚 Kutubxona", "menu_books")
    .text("🔍 Qidirish", "menu_search")
    .row()
    .text("📖 Davom ettirish", "menu_continue")
    .text("🎯 Missiyalar", "menu_missions")
    .row()
    .text("🏆 Reyting", "menu_ranking")
    .text("🪙 Coinlarim", "menu_coins")
    .row()
    .text("📊 Statistikam", "menu_stats")
    .text("👤 Profil", "menu_profile")
    .row()
    .url("🌐 Kutubxonani ochish", MINI_APP_URL);

  const roleLabel = role === "TEACHER" ? "O'qituvchi" : "O'quvchi";

  await ctx.editMessageText(
    `✅ <b>Tizimga muvaffaqiyatli kirildi!</b>\n\n` +
      `👤 ${escapeHtml(user.name)}\n` +
      `🔰 ${roleLabel}\n\n` +
      `Quyidagi amallardan birini tanlang:`,
    {
      parse_mode: "HTML",
      reply_markup: keyboard,
    }
  );
});

// ─── Menu: Books ────────────────────────────────────────────

bot.callbackQuery("menu_books", async (ctx) => {
  await ctx.answerCallbackQuery();

  const books = await prisma.book.findMany({
    where: { isPublished: true },
    include: { author: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  let text = `📚 <b>Kutubxona</b>\n\n`;
  const keyboard = new InlineKeyboard();

  books.forEach((book, i) => {
    const author = book.author?.name || "Noma'lum";
    text += `${i + 1}. <b>${escapeHtml(book.title)}</b>\n`;
    text += `   ✍️ ${escapeHtml(author)} · 📄 ${book.totalPages} sahifa\n\n`;

    keyboard.text(`${i + 1}`, `book_${book.slug}`).row();
  });

  keyboard.text("🔙 Orqaga", "back_main").row();

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
});

// ─── Menu: Book detail ─────────────────────────────────────

bot.callbackQuery(/^book_(.+)$/, async (ctx) => {
  const slug = ctx.match[1];
  await ctx.answerCallbackQuery();

  const book = await prisma.book.findUnique({
    where: { slug },
    include: { author: true, category: true, ratings: { select: { rating: true } } },
  });

  if (!book) {
    await ctx.editMessageText("Kitob topilmadi.");
    return;
  }

  const avgRating =
    book.ratings.length > 0
      ? (book.ratings.reduce((s, r) => s + r.rating, 0) / book.ratings.length).toFixed(1)
      : "—";

  const text =
    `📖 <b>${escapeHtml(book.title)}</b>\n\n` +
    `✍️ Muallif: <b>${escapeHtml(book.author?.name || "Noma'lum")}</b>\n` +
    `📂 Kategoriya: ${escapeHtml(book.category?.name || "—")}\n` +
    `📄 Sahifalar: ${book.totalPages}\n` +
    `⭐ Reyting: ${avgRating}\n` +
    (book.description ? `\n📝 ${escapeHtml(book.description.slice(0, 200))}` : "");

  const keyboard = new InlineKeyboard()
    .url("📖 O'qish", `${MINI_APP_URL}/reader/${slug}`)
    .row()
    .text("❤️ Saqlash", `fav_${book.id}`)
    .text("🔖 Bookmark", `bm_${book.id}`)
    .row()
    .text("🔙 Orqaga", "menu_books");

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
});

// ─── Menu: Search ──────────────────────────────────────────

bot.callbackQuery("menu_search", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `🔍 <b>Qidirish</b>\n\n` +
      `Kitob nomini yoki muallifni yozing:\n` +
      `Masalan: <code>O'tkan kunlar</code> yoki <code>Qodiriy</code>`,
    { parse_mode: "HTML" }
  );
});

// Listen for text messages for search
bot.on("message:text", async (ctx) => {
  const telegramId = ctx.from.id;
  const user = await getUserByTelegramId(telegramId);
  if (!user) return;

  const query = ctx.message.text.trim();
  if (query.startsWith("/") || query.length < 2) return;

  const books = await prisma.book.findMany({
    where: {
      isPublished: true,
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
        { author: { name: { contains: query } } },
      ],
    },
    include: { author: true },
    take: 5,
  });

  if (books.length === 0) {
    await ctx.reply(`🔍 "${escapeHtml(query)}" bo'yicha hech narsa topilmadi.`);
    return;
  }

  let text = `🔍 <b>"${escapeHtml(query)}" natijalari:</b>\n\n`;
  const keyboard = new InlineKeyboard();

  books.forEach((book, i) => {
    text += `${i + 1}. <b>${escapeHtml(book.title)}</b>\n`;
    text += `   ✍️ ${escapeHtml(book.author?.name || "Noma'lum")}\n\n`;
    keyboard.text(`${i + 1}`, `book_${book.slug}`).row();
  });

  keyboard.text("🔙 Orqaga", "back_main").row();

  await ctx.reply(text, { parse_mode: "HTML", reply_markup: keyboard });
});

// ─── Menu: Continue Reading ────────────────────────────────

bot.callbackQuery("menu_continue", async (ctx) => {
  await ctx.answerCallbackQuery();
  const telegramId = ctx.from.id;
  const user = await getUserByTelegramId(telegramId);
  if (!user) return;

  const progress = await prisma.readingProgress.findMany({
    where: { userId: user.id, completedAt: null },
    include: { book: { include: { author: true } } },
    orderBy: { lastReadAt: "desc" },
    take: 5,
  });

  if (progress.length === 0) {
    await ctx.editMessageText(
      `📖 <b>Davom ettirish</b>\n\nHali hech qanday kitob o'qilmagan.\nKutubxonadan kitob tanlang!`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().text("📚 Kutubxona", "menu_books").row()
          .text("🔙 Orqaga", "back_main"),
      }
    );
    return;
  }

  let text = `📖 <b>Davom ettirish</b>\n\n`;
  const keyboard = new InlineKeyboard();

  progress.forEach((p) => {
    const total = p.book.totalPages || 320;
    const pct = Math.round((p.currentPage / total) * 100);
    text += `📕 <b>${escapeHtml(p.book.title)}</b>\n`;
    text += `   📄 ${p.currentPage}/${total} · ${pct}%\n\n`;
    keyboard.text(`▶️ ${p.book.title.slice(0, 20)}`, `reader_${p.book.slug}`).row();
  });

  keyboard.text("🔙 Orqaga", "back_main").row();

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
});

// ─── Menu: Missions ────────────────────────────────────────

bot.callbackQuery("menu_missions", async (ctx) => {
  await ctx.answerCallbackQuery();

  const text =
    `🎯 <b>Missiyalar</b>\n\n` +
    `• Haftalik 100 sahifa — <b>80%</b> bajarildi\n` +
    `• 30 sahifa challenge — <b>60%</b> bajarildi\n\n` +
    `Batafsil ko'rish uchun web ilovani oching.`;

  const keyboard = new InlineKeyboard()
    .url("🎯 Missiyalarni ko'rish", `${MINI_APP_URL}/missions`)
    .row()
    .text("🔙 Orqaga", "back_main");

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
});

// ─── Menu: Ranking ─────────────────────────────────────────

bot.callbackQuery("menu_ranking", async (ctx) => {
  await ctx.answerCallbackQuery();
  const telegramId = ctx.from.id;
  const user = await getUserByTelegramId(telegramId);

  const rankings = await prisma.user.findMany({
    where: { isActive: true, role: "STUDENT" },
    select: {
      id: true,
      name: true,
      progress: { select: { currentPage: true } },
    },
  });

  // Calculate total pages per user
  const ranked = rankings
    .map((u) => ({
      name: u.name,
      pages: u.progress.reduce((sum, p) => sum + p.currentPage, 0),
      isMe: user?.id === u.id,
    }))
    .sort((a, b) => b.pages - a.pages)
    .slice(0, 10);

  let text = `🏆 <b>Reyting</b>\n\n`;
  const medals = ["🥇", "🥈", "🥉"];

  ranked.forEach((r, i) => {
    const medal = i < 3 ? medals[i] : `${i + 1}.`;
    const me = r.isMe ? " ← <b>Siz</b>" : "";
    text += `${medal} <b>${escapeHtml(r.name)}</b> — ${r.pages} sahifa${me}\n`;
  });

  const keyboard = new InlineKeyboard()
    .url("🏆 To'liq reyting", `${MINI_APP_URL}/ranking`)
    .row()
    .text("🔙 Orqaga", "back_main");

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
});

// ─── Menu: Coins ───────────────────────────────────────────

bot.callbackQuery("menu_coins", async (ctx) => {
  await ctx.answerCallbackQuery();

  const text =
    `🪙 <b>Mening coinlarim</b>\n\n` +
    `💰 Balans: <b>450</b> coin\n\n` +
    `📋 Tarix:\n` +
    `  +50 Missiya bajarildi\n` +
    `  +20 Kitob tugatildi\n` +
    `  +10 Kunlik maqsad\n` +
    `  -100 Marketdan sotib olindi`;

  const keyboard = new InlineKeyboard()
    .url("🛒 Market", `${MINI_APP_URL}/coins`)
    .row()
    .text("🔙 Orqaga", "back_main");

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
});

// ─── Menu: Statistics ──────────────────────────────────────

bot.callbackQuery("menu_stats", async (ctx) => {
  await ctx.answerCallbackQuery();
  const telegramId = ctx.from.id;
  const user = await getUserByTelegramId(telegramId);
  if (!user) return;

  const pagesAgg = await prisma.readingProgress.aggregate({
    where: { userId: user.id },
    _sum: { currentPage: true },
  });

  const completed = await prisma.readingProgress.count({
    where: { userId: user.id, completedAt: { not: null } },
  });

  const totalPages = pagesAgg._sum.currentPage ?? 0;

  const text =
    `📊 <b>Statistikam</b>\n\n` +
    `📄 O'qilgan sahifa: <b>${totalPages}</b>\n` +
    `📚 Tugatilgan kitob: <b>${completed}</b>\n` +
    `⏱ O'qish vaqti: <b>${Math.round(totalPages * 1.5)} daq</b>`;

  const keyboard = new InlineKeyboard()
    .url("📊 Batafsil", `${MINI_APP_URL}/statistics`)
    .row()
    .text("🔙 Orqaga", "back_main");

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
});

// ─── Menu: Profile ─────────────────────────────────────────

bot.callbackQuery("menu_profile", async (ctx) => {
  await ctx.answerCallbackQuery();
  const telegramId = ctx.from.id;
  const user = await getUserByTelegramId(telegramId);
  if (!user) return;

  const roleLabel =
    user.role === "ADMIN" ? "Admin" : user.role === "TEACHER" ? "O'qituvchi" : "O'quvchi";

  const text =
    `👤 <b>Profil</b>\n\n` +
    `📛 Ism: <b>${escapeHtml(user.name)}</b>\n` +
    `🔰 Rol: ${roleLabel}\n` +
    `📅 Qo'shilgan: ${new Date(user.createdAt).toLocaleDateString("uz-UZ")}`;

  const keyboard = new InlineKeyboard()
    .url("⚙️ Sozlamalar", `${MINI_APP_URL}/settings`)
    .row()
    .text("🔙 Orqaga", "back_main");

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
});

// ─── Back to main ──────────────────────────────────────────

bot.callbackQuery("back_main", async (ctx) => {
  await ctx.answerCallbackQuery();
  // Re-run /start logic
  const telegramId = ctx.from.id;
  const user = await getUserByTelegramId(telegramId);

  const keyboard = new InlineKeyboard();

  if (user) {
    keyboard
      .text("📚 Kutubxona", "menu_books")
      .text("🔍 Qidirish", "menu_search")
      .row()
      .text("📖 Davom ettirish", "menu_continue")
      .text("🎯 Missiyalar", "menu_missions")
      .row()
      .text("🏆 Reyting", "menu_ranking")
      .text("🪙 Coinlarim", "menu_coins")
      .row()
      .text("📊 Statistikam", "menu_stats")
      .text("👤 Profil", "menu_profile")
      .row()
      .url("🌐 Kutubxonani ochish", MINI_APP_URL);

    await ctx.editMessageText(
      `📚 <b>Assalomu alaykum, ${escapeHtml(user.name)}!</b>\n\n` +
        `MBSI Library ga xush kelibsiz. Quyidagi amallardan birini tanlang:`,
      { parse_mode: "HTML", reply_markup: keyboard }
    );
  }
});

// ─── Favorite / Bookmark callbacks ─────────────────────────

bot.callbackQuery(/^fav_(.+)$/, async (ctx) => {
  const bookId = ctx.match[1];
  await ctx.answerCallbackQuery({ text: "❤️ Sevimlilar qo'shildi!" });
});

bot.callbackQuery(/^bm_(.+)$/, async (ctx) => {
  const bookId = ctx.match[1];
  await ctx.answerCallbackQuery({ text: "🔖 Bookmark saqlandi!" });
});

bot.callbackQuery(/^reader_(.+)$/, async (ctx) => {
  const slug = ctx.match[1];
  await ctx.answerCallbackQuery();
  await ctx.reply(`📖 O'qish boshlandi!\n\n🔗 ${MINI_APP_URL}/reader/${slug}`);
});

// ─── Help ───────────────────────────────────────────────────

bot.command("help", async (ctx) => {
  await ctx.reply(
    `📚 <b>MBSI Library Bot — Yordam</b>\n\n` +
      `/start — Bosh menyu\n` +
      `/help — Yordam\n\n` +
      `📝 Qidirish uchun kitob nomini yoki muallifni yozing.\n\n` +
      `🌐 Web ilova: ${MINI_APP_URL}`,
    { parse_mode: "HTML" }
  );
});

// ─── Error handling ────────────────────────────────────────

bot.catch((err) => {
  console.error("Bot error:", err);
});

// ─── Export for use in API route / standalone ───────────────

export { bot };
