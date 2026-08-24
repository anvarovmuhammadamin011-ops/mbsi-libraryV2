// ============================================================
// MBSI Library — Telegram Bot (with Mini App)
// ============================================================
// Token: from .env (TELEGRAM_BOT_TOKEN)
// Usage: npm run bot (dev) or node dist/bot/index.js (prod)
// ============================================================

import { Bot, InlineKeyboard } from "grammy";
import { prisma } from "../lib/db";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const MINI_APP_URL = process.env.MINI_APP_URL || "http://localhost:3000";

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

// ─── Mini App Button Helper ─────────────────────────────────
function miniAppButton(label: string, path: string = "") {
  return { web_app: { url: `${MINI_APP_URL}${path}` } };
}

// ─── /start ─────────────────────────────────────────────────

bot.command("start", async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = await getUserByTelegramId(telegramId);

  if (user) {
    // Logged in — show main menu
    await ctx.reply(
      `📚 <b>Assalomu alaykum, ${escapeHtml(user.name)}!</b>\n\n` +
        `MBSI Library ga xush kelibsiz. Quyidagi amallardan birini tanlang:`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📚 Kutubxona", callback_data: "menu_books" }, { text: "🔍 Qidirish", callback_data: "menu_search" }],
            [{ text: "📖 Davom ettirish", callback_data: "menu_continue" }, { text: "🎯 Missiyalar", callback_data: "menu_missions" }],
            [{ text: "🏆 Reyting", callback_data: "menu_ranking" }, { text: "🪙 Coinlarim", callback_data: "menu_coins" }],
            [{ text: "📊 Statistikam", callback_data: "menu_stats" }, { text: "👤 Profil", callback_data: "menu_profile" }],
            [{ text: "🌐 Kutubxonani ochish", web_app: { url: MINI_APP_URL } }],
          ],
        },
      }
    );
  } else {
    // Not logged in — show login options
    await ctx.reply(
      `📚 <b>MBSI Library</b>\n\n` +
        `O'quvchi kutubxonasi platformasiga xush kelibsiz!\n\n` +
        `Telegram hisobingiz orqali kirish uchun role tanlang:`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "👨‍🎓 O'quvchi sifatida kirish", callback_data: "login_STUDENT" }],
            [{ text: "👨‍🏫 O'qituvchi sifatida kirish", callback_data: "login_TEACHER" }],
            [{ text: "🌐 Web'dan kirish", web_app: { url: MINI_APP_URL } }],
          ],
        },
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
  const roleLabel = role === "TEACHER" ? "O'qituvchi" : "O'quvchi";

  await ctx.editMessageText(
    `✅ <b>Tizimga muvaffaqiyatli kirildi!</b>\n\n` +
      `👤 ${escapeHtml(user.name)}\n` +
      `🔰 ${roleLabel}\n\n` +
      `Quyidagi amallardan birini tanlang:`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📚 Kutubxona", callback_data: "menu_books" }, { text: "🔍 Qidirish", callback_data: "menu_search" }],
          [{ text: "📖 Davom ettirish", callback_data: "menu_continue" }, { text: "🎯 Missiyalar", callback_data: "menu_missions" }],
          [{ text: "🏆 Reyting", callback_data: "menu_ranking" }, { text: "🪙 Coinlarim", callback_data: "menu_coins" }],
          [{ text: "📊 Statistikam", callback_data: "menu_stats" }, { text: "👤 Profil", callback_data: "menu_profile" }],
          [{ text: "🌐 Kutubxonani ochish", web_app: { url: MINI_APP_URL } }],
        ],
      },
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
  const rows: any[][] = [];

  books.forEach((book, i) => {
    const author = book.author?.name || "Noma'lum";
    text += `${i + 1}. <b>${escapeHtml(book.title)}</b>\n`;
    text += `   ✍️ ${escapeHtml(author)} · 📄 ${book.totalPages} sahifa\n\n`;
    rows.push([{ text: `${i + 1}. ${book.title.slice(0, 25)}`, callback_data: `book_${book.slug}` }]);
  });

  rows.push([{ text: "🔙 Orqaga", callback_data: "back_main" }]);

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: rows },
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

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "📖 O'qishni boshlash", web_app: { url: `${MINI_APP_URL}/reader/${book.id}` } }],
        [{ text: "❤️ Saqlash", callback_data: `fav_${book.id}` }, { text: "🔖 Bookmark", callback_data: `bm_${book.id}` }],
        [{ text: "🔙 Orqaga", callback_data: "menu_books" }],
      ],
    },
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
  const rows: any[][] = [];

  books.forEach((book, i) => {
    text += `${i + 1}. <b>${escapeHtml(book.title)}</b>\n`;
    text += `   ✍️ ${escapeHtml(book.author?.name || "Noma'lum")}\n\n`;
    rows.push([{ text: `${i + 1}. ${book.title.slice(0, 25)}`, callback_data: `book_${book.slug}` }]);
  });

  rows.push([{ text: "🔙 Orqaga", callback_data: "back_main" }]);

  await ctx.reply(text, { parse_mode: "HTML", reply_markup: { inline_keyboard: rows } });
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
        reply_markup: {
          inline_keyboard: [
            [{ text: "📚 Kutubxona", callback_data: "menu_books" }],
            [{ text: "🔙 Orqaga", callback_data: "back_main" }],
          ],
        },
      }
    );
    return;
  }

  let text = `📖 <b>Davom ettirish</b>\n\n`;
  const rows: any[][] = [];

  progress.forEach((p) => {
    const total = p.book.totalPages || 320;
    const pct = Math.round((p.currentPage / total) * 100);
    text += `📕 <b>${escapeHtml(p.book.title)}</b>\n`;
    text += `   📄 ${p.currentPage}/${total} · ${pct}%\n\n`;
    rows.push([{ text: `▶️ ${p.book.title.slice(0, 20)} (${pct}%)`, web_app: { url: `${MINI_APP_URL}/reader/${p.book.id}` } }]);
  });

  rows.push([{ text: "🔙 Orqaga", callback_data: "back_main" }]);

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: rows },
  });
});

// ─── Menu: Missions ────────────────────────────────────────

bot.callbackQuery("menu_missions", async (ctx) => {
  await ctx.answerCallbackQuery();

  await ctx.editMessageText(
    `🎯 <b>Missiyalar</b>\n\n` +
      `• Haftalik 100 sahifa — <b>80%</b> bajarildi\n` +
      `• 30 sahifa challenge — <b>60%</b> bajarildi\n\n` +
      `Batafsil ko'rish uchun web ilovani oching.`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎯 Missiyalarni ko'rish", web_app: { url: `${MINI_APP_URL}/missions` } }],
          [{ text: "🔙 Orqaga", callback_data: "back_main" }],
        ],
      },
    }
  );
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

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🏆 To'liq reyting", web_app: { url: `${MINI_APP_URL}/ranking` } }],
        [{ text: "🔙 Orqaga", callback_data: "back_main" }],
      ],
    },
  });
});

// ─── Menu: Coins ───────────────────────────────────────────

bot.callbackQuery("menu_coins", async (ctx) => {
  await ctx.answerCallbackQuery();

  await ctx.editMessageText(
    `🪙 <b>Mening coinlarim</b>\n\n` +
      `💰 Balans: <b>450</b> coin\n\n` +
      `📋 Tarix:\n` +
      `  +50 Missiya bajarildi\n` +
      `  +20 Kitob tugatildi\n` +
      `  +10 Kunlik maqsad\n` +
      `  -100 Marketdan sotib olindi`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🛒 Market", web_app: { url: `${MINI_APP_URL}/coins` } }],
          [{ text: "🔙 Orqaga", callback_data: "back_main" }],
        ],
      },
    }
  );
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

  await ctx.editMessageText(
    `📊 <b>Statistikam</b>\n\n` +
      `📄 O'qilgan sahifa: <b>${totalPages}</b>\n` +
      `📚 Tugatilgan kitob: <b>${completed}</b>\n` +
      `⏱ O'qish vaqti: <b>${Math.round(totalPages * 1.5)} daq</b>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📊 Batafsil ko'rish", web_app: { url: `${MINI_APP_URL}/statistics` } }],
          [{ text: "🔙 Orqaga", callback_data: "back_main" }],
        ],
      },
    }
  );
});

// ─── Menu: Profile ─────────────────────────────────────────

bot.callbackQuery("menu_profile", async (ctx) => {
  await ctx.answerCallbackQuery();
  const telegramId = ctx.from.id;
  const user = await getUserByTelegramId(telegramId);
  if (!user) return;

  const roleLabel =
    user.role === "ADMIN" ? "Admin" : user.role === "TEACHER" ? "O'qituvchi" : "O'quvchi";

  await ctx.editMessageText(
    `👤 <b>Profil</b>\n\n` +
      `📛 Ism: <b>${escapeHtml(user.name)}</b>\n` +
      `🔰 Rol: ${roleLabel}\n` +
      `📅 Qo'shilgan: ${new Date(user.createdAt).toLocaleDateString("uz-UZ")}`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⚙️ Sozlamalar", web_app: { url: `${MINI_APP_URL}/settings` } }],
          [{ text: "🔙 Orqaga", callback_data: "back_main" }],
        ],
      },
    }
  );
});

// ─── Back to main ──────────────────────────────────────────

bot.callbackQuery("back_main", async (ctx) => {
  await ctx.answerCallbackQuery();
  const telegramId = ctx.from.id;
  const user = await getUserByTelegramId(telegramId);

  if (user) {
    await ctx.editMessageText(
      `📚 <b>Assalomu alaykum, ${escapeHtml(user.name)}!</b>\n\n` +
        `MBSI Library ga xush kelibsiz. Quyidagi amallardan birini tanlang:`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📚 Kutubxona", callback_data: "menu_books" }, { text: "🔍 Qidirish", callback_data: "menu_search" }],
            [{ text: "📖 Davom ettirish", callback_data: "menu_continue" }, { text: "🎯 Missiyalar", callback_data: "menu_missions" }],
            [{ text: "🏆 Reyting", callback_data: "menu_ranking" }, { text: "🪙 Coinlarim", callback_data: "menu_coins" }],
            [{ text: "📊 Statistikam", callback_data: "menu_stats" }, { text: "👤 Profil", callback_data: "menu_profile" }],
            [{ text: "🌐 Kutubxonani ochish", web_app: { url: MINI_APP_URL } }],
          ],
        },
      }
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
