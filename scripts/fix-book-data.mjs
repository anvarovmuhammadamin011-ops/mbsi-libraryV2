// ============================================================
// MBSI Library — Fix book/author data inconsistencies
// ============================================================
// Fixes:
//   1. Wrong author assignments (Zero to One → Peter Thiel, etc.)
//   2. Test data cleanup (test authors, test books, test categories)
//   3. Cover SVG files showing wrong author names
//
// Usage:
//   node scripts/fix-book-data.mjs            → dry-run (shows plan)
//   node scripts/fix-book-data.mjs --apply    → writes changes
// ============================================================

import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const APPLY = process.argv.includes("--apply");
const prisma = new PrismaClient();

// ─── 1. Correct author for each book (by exact title) ────────
const TITLE_TO_AUTHOR = {
  "Atomic Habits": "James Clear",
  "Atomic Habits (Uzbek)": "James Clear",
  "Deep Work": "Cal Newport",
  "The Alchemist": "Paulo Coelho",
  "Thinking, Fast and Slow": "Daniel Kahneman",
  Sapiens: "Yuval Noah Harari",
  "The Monk Who Sold His Ferrari": "Robin Sharma",
  "How to Win Friends": "Dale Carnegie",
  "Word Power Made Easy": "Norman Lewis",
  "O'tkan Kunlar": "Abdulla Qodiriy",
  "Jaynomad": "O'tkir Hoshimov",
  "A Brief History of Time": "Stephen Hawking",
  "Jur'a Tandir": "Chingiz Aytmatov",
  "Mental Arithmetic": "Mehmon Baxtiyorov",
  "The Power of Now": "Eckhart Tolle",
  "Rich Dad Poor Dad": "Robert Kiyosaki",
  "The 48 Laws of Power": "Robert Greene",
  "Start with Why": "Simon Sinek",
  "Zero to One": "Peter Thiel",
  "Good to Great": "Jim Collins",
  "The Lean Startup": "Eric Ries",
  "Thinking in Systems": "Donella Meadows",
  "The Art of War": "Sun Tzu",
  "Meditations": "Marcus Aurelius",
  "The Obstacle Is the Way": "Ryan Holiday",
  "Ego Is the Enemy": "Ryan Holiday",
  "Principles": "Ray Dalio",
  "Can't Hurt Me": "David Goggins",
  "The 5 AM Club": "Robin Sharma",
  "Ikigai": "Héctor García",
  "O'zbekiston Tarixi": "Jamol Karimov",
  "Matematika Asoslari": "Mehmon Baxtiyorov",
  "Fizika Qonunlari": "Stephen Hawking",
  "Ingliz Tili Grammatikasi": "Norman Lewis",
  "Adabiyot Tanlangan": "O'tkir Hoshimov",
  "Psixologiya Kirish": "Daniel Goleman",
  "Biznes Asoslari": "Robert Kiyosaki",
  "Falsafa Lug'at": "Mahmud Do'stonov",
  "Sun'iy Intellekt": "Stuart Russell",
  "Iqlim O'zgarishi": "Bill Gates",
  "Biologiya": "Mehmon Baxtiyorov",
  "Kimyo Asoslari": "Mehmon Baxtiyorov",
  "Geografiya": "Mehmon Baxtiyorov",
  "Informatika": "Mehmon Baxtiyorov",
  "Tarixiy Asarlar": "Chingiz Aytmatov",
  "Zamonaviy Adabiyot": "O'tkir Hoshimov",
  "Ilmiy Kashfiyotlar": "Stephen Hawking",
  "Moliya Boshqaruvi": "Robert Kiyosaki",
  "Muloqot San'ati": "Dale Carnegie",
  "Hayot Falsafasi": "Eckhart Tolle",
};

// ─── 2. Test data to remove ─────────────────────────────────
const TEST_AUTHOR_NAMES = ["ali", "E2E Author", "Browser Author", "Sinov Muallif"];
const TEST_BOOK_TITLES = ["E2E Upload Test"];

// ─── 3. Cover files that display wrong author names ─────────
// After the DB fix these SVGs would contradict the real author,
// so we patch the <text> node of each cover too.
const COVER_AUTHOR_OVERRIDES = {
  "/covers/book-3.svg": "Cal Newport",
  "/covers/book-4.svg": "Daniel Kahneman",
  "/covers/book-5.svg": "Yuval Noah Harari",
  "/covers/book-14.svg": "Eckhart Tolle",
  "/covers/book-15.svg": "Robert Kiyosaki",
  "/covers/book-16.svg": "Robert Greene",
  "/covers/book-17.svg": "Simon Sinek",
  "/covers/book-18.svg": "Peter Thiel",
  "/covers/book-19.svg": "Jim Collins",
  "/covers/book-20.svg": "Eric Ries",
  "/covers/book-21.svg": "Donella Meadows",
  "/covers/book-22.svg": "Sun Tzu",
  "/covers/book-23.svg": "Marcus Aurelius",
  "/covers/book-24.svg": "Ryan Holiday",
  "/covers/book-25.svg": "Ryan Holiday",
  "/covers/book-26.svg": "Ray Dalio",
  "/covers/book-27.svg": "David Goggins",
  "/covers/book-28.svg": "Robin Sharma",
  "/covers/book-29.svg": "Héctor García",
  "/covers/book-31.svg": "Jamol Karimov",
  "/covers/book-33.svg": "Stephen Hawking",
  "/covers/book-36.svg": "Daniel Goleman",
  "/covers/book-37.svg": "Robert Kiyosaki",
  "/covers/book-38.svg": "Mahmud Do'stonov",
  "/covers/book-39.svg": "Stuart Russell",
  "/covers/book-40.svg": "Bill Gates",
  "/covers/book-44.svg": "Mehmon Baxtiyorov",
  "/covers/book-47.svg": "Stephen Hawking",
  "/covers/book-48.svg": "Robert Kiyosaki",
  "/covers/book-50.svg": "Eckhart Tolle",
};

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function patchCoverAuthor(relPath, authorName) {
  const fsPath = join(process.cwd(), "public", relPath.replace(/^\/+/, ""));
  if (!existsSync(fsPath)) return false;
  let content = readFileSync(fsPath, "utf8");
  // The author line is the last <text> with letter-spacing="1"
  const re = /(<text[^>]*letter-spacing="1"[^>]*>)([^<]*)(<\/text>)/;
  if (!re.test(content)) return false;
  content = content.replace(re, `$1${esc(authorName)}$3`);
  writeFileSync(fsPath, content, "utf8");
  return true;
}

async function ensureAuthor(name) {
  const clean = name.trim();
  const existing = await prisma.author.findFirst({ where: { name: clean } });
  if (existing) return existing;
  return prisma.author.create({ data: { name: clean } });
}

async function main() {
  console.log(`\n🔧 Fix book data — mode: ${APPLY ? "APPLY ✍️" : "DRY-RUN (nothing is written)"}\n`);

  // ── A. Fix wrong authors ──────────────────────────────────
  console.log("── A. Author fixes ──");
  let authorFixes = 0;
  for (const [title, correctAuthor] of Object.entries(TITLE_TO_AUTHOR)) {
    const book = await prisma.book.findFirst({
      where: { title },
      include: { author: { select: { name: true } } },
    });
    if (!book) {
      console.log(`   ⚠️  "${title}" — not found in DB (skipped)`);
      continue;
    }
    if (book.author?.name === correctAuthor) continue;
    authorFixes++;
    console.log(`   "${book.title}": ${book.author?.name} → ${correctAuthor}`);
    if (APPLY) {
      const author = await ensureAuthor(correctAuthor);
      await prisma.book.update({ where: { id: book.id }, data: { authorId: author.id } });
    }
  }
  if (authorFixes === 0) console.log("   ✅ All authors already correct");

  // ── B. Delete test data ───────────────────────────────────
  console.log("\n── B. Test data cleanup ──");
  const testAuthors = await prisma.author.findMany({
    where: { name: { in: TEST_AUTHOR_NAMES } },
    include: { books: { select: { id: true, title: true } } },
  });
  for (const a of testAuthors) {
    for (const b of a.books) {
      console.log(`   🗑  book "${b.title}" (test)`);
      if (APPLY) {
        // delete dependent rows first, then the book
        await prisma.readingProgress.deleteMany({ where: { bookId: b.id } });
        await prisma.readingSession.deleteMany({ where: { bookId: b.id } });
        await prisma.bookmark.deleteMany({ where: { bookId: b.id } });
        await prisma.favorite.deleteMany({ where: { bookId: b.id } });
        await prisma.rating.deleteMany({ where: { bookId: b.id } });
        await prisma.review.deleteMany({ where: { bookId: b.id } });
        await prisma.bookContent.deleteMany({ where: { bookId: b.id } });
        await prisma.book.delete({ where: { id: b.id } });
      }
    }
    console.log(`   🗑  author "${a.name}" (test)`);
    if (APPLY) await prisma.author.delete({ where: { id: a.id } });
  }
  const testBooks = await prisma.book.findMany({
    where: { title: { in: TEST_BOOK_TITLES } },
    select: { id: true, title: true },
  });
  for (const b of testBooks) {
    console.log(`   🗑  book "${b.title}" (test)`);
    if (APPLY) {
      await prisma.readingProgress.deleteMany({ where: { bookId: b.id } });
      await prisma.readingSession.deleteMany({ where: { bookId: b.id } });
      await prisma.bookmark.deleteMany({ where: { bookId: b.id } });
      await prisma.favorite.deleteMany({ where: { bookId: b.id } });
      await prisma.rating.deleteMany({ where: { bookId: b.id } });
      await prisma.review.deleteMany({ where: { bookId: b.id } });
      await prisma.bookContent.deleteMany({ where: { bookId: b.id } });
      await prisma.book.delete({ where: { id: b.id } });
    }
  }
  if (testAuthors.length === 0 && testBooks.length === 0)
    console.log("   ✅ No test data found");

  // ── C. Delete empty test categories ───────────────────────
  console.log("\n── C. Test/empty category cleanup ──");
  const emptyCats = await prisma.category.findMany({
    where: { books: { none: {} } },
    select: { id: true, name: true },
  });
  for (const c of emptyCats) {
    console.log(`   🗑  empty category "${c.name}"`);
    if (APPLY) await prisma.category.delete({ where: { id: c.id } });
  }
  if (emptyCats.length === 0) console.log("   ✅ No empty categories");
  console.log("   ℹ️  Note: empty non-test categories are also removed; UI already filters 0-book categories.");

  // ── D. Patch cover SVGs showing wrong author ─────────────
  console.log("\n── D. Cover file fixes (public/covers/*.svg) ──");
  let coverFixes = 0;
  for (const [rel, author] of Object.entries(COVER_AUTHOR_OVERRIDES)) {
    if (!APPLY) {
      console.log(`   ${rel} → author text "${author}"`);
      coverFixes++;
    } else if (patchCoverAuthor(rel, author)) {
      console.log(`   ✅ ${rel} → "${author}"`);
      coverFixes++;
    } else {
      console.log(`   ⚠️  ${rel} — could not patch (file missing or pattern not found)`);
    }
  }
  if (!APPLY && coverFixes === 0) console.log("   ✅ No covers to patch");

  // ── Summary ───────────────────────────────────────────────
  console.log(`\n📋 Summary:`);
  console.log(`   Author fixes:   ${authorFixes}`);
  console.log(`   Test rows:      ${testAuthors.reduce((n, a) => n + a.books.length, 0) + testBooks.length} books, ${testAuthors.length} authors`);
  console.log(`   Empty cats:     ${emptyCats.length}`);
  console.log(`   Cover patches:  ${APPLY ? coverFixes : Object.keys(COVER_AUTHOR_OVERRIDES).length}`);
  if (!APPLY) {
    console.log(`\n👉 This was a DRY-RUN. To write changes run:`);
    console.log(`   node scripts/fix-book-data.mjs --apply\n`);
  } else {
    console.log(`\n🎉 Done. Restart the dev server / redeploy to see changes.\n`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Fix failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
