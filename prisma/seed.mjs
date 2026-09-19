// ============================================================
// MBSI Library — Database Seed Script
// ============================================================
// Populates the database with the real library catalogue
// (Uzbek literature) for development and initial setup.
// Old placeholder/demo books are removed automatically.
// Run: npm run db:seed
// ============================================================

import { PrismaClient } from "@prisma/client";

import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────
function slugify(input) {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return base || "book";
}

function iso(dateStr) {
  return new Date(dateStr);
}

// ─── Demo Data ────────────────────────────────────────────
const USERS = [
  { id: "user-1", name: "Muhammadamin Toshtemirov", role: "STUDENT", avatar: "/avatars/student-1.svg" },
  { id: "user-2", name: "Aziz Karimov", role: "STUDENT", avatar: "/avatars/student-2.svg" },
  { id: "user-3", name: "Samir Rustamov", role: "STUDENT", avatar: "/avatars/student-3.svg" },
  { id: "user-4", name: "Nodira Abdullayeva", role: "STUDENT", avatar: "/avatars/student-4.svg" },
  { id: "user-5", name: "Jasur Toshmatov", role: "STUDENT", avatar: "/avatars/student-5.svg" },
  { id: "user-6", name: "Dilshod Mirzayev", role: "TEACHER", avatar: "/avatars/teacher-1.svg" },
  { id: "user-7", name: "Gulnora Karimova", role: "TEACHER", avatar: "/avatars/teacher-2.svg" },
  { id: "user-8", name: "Alisher Navoiy", role: "ADMIN", avatar: "/avatars/admin-1.svg" },
];

// ── Mualliflar: faol (handybook) fondidagi asarlar mualliflari ──
const AUTHORS = [
  { id: "cmu5aqbtx000cov4c4nszrbzz", name: "Anthony Burgess", biography: "Britaniyalik yozuvchi." },
  { id: "author-charles-dickens", name: "Charles Dickens", biography: "Ingliz klassik yozuvchisi." },
  { id: "cmu5ap8bd0001ov4c5xvq7sjy", name: "Paulo Koelo", biography: "Braziliyalik yozuvchi." },
  { id: "cmu5aqjgy000jov4c1a26w73w", name: "Toni Morrison", biography: "Amerikalik yozuvchi." },
  { id: "cmu54g4gr0039ovm4s3ltef2u", name: "Aldous Huxley", biography: "Ingliz yozuvchisi." },
  { id: "cmu5armel000rov4c9qa9pwwl", name: "Fyodor Dostoevsky", biography: "Rus klassik yozuvchisi." },
  { id: "cmu5azz5r0001ovy8itjj2s3y", name: "Oʻtkir Hoshimov", biography: "O'zbek xalq yozuvchisi." },
  { id: "cmu5apt560005ov4cpl2l5ygj", name: "Said Ahmad", biography: "O'zbek yozuvchisi." },
  { id: "cmu5botdr0001ova0521e9eew", name: "Fyodor Mihaylovich Dostoyevsk", biography: "Rus klassik yozuvchisi." },
  { id: "cmu5aqy8c000nov4cqieza99n", name: "John Steinbeck", biography: "Amerikalik yozuvchi." },
  { id: "cmu54gh3v0041ovm42o8kiu1q", name: "Franz Kafka", biography: "Nemis tilida ijod qilgan yozuvchi." },
  { id: "cmu5asvh0001eov4c6uabw6x6", name: "William Faulkner", biography: "Amerikalik yozuvchi." },
  { id: "author-ernest-hemingway", name: "Ernest Hemingway", biography: "Amerikalik yozuvchi." },
  { id: "cmu5asefc0017ov4cl3jbydaw", name: "Chinua Achebe", biography: "Nigeriyalik yozuvchi." },
  { id: "cmu54bl850005ov64gtuc5k02", name: "Harper Lee", biography: "Amerikalik yozuvchi." },
  { id: "cmu5asatm0013ov4c374n59mv", name: "Yu Hua", biography: "Xitoylik yozuvchi." },
  { id: "author-97", name: "O'zbek xalq ertaklari", biography: "O'zbek xalq og'zaki ijodi." },
  { id: "cmu5as5os000zov4c5eovbhql", name: "Thomas More", biography: "Ingliz faylasufi va yozuvchisi." },
  { id: "cmu5as2pw000vov4cl8xfkmq8", name: "Leo Tolstoy", biography: "Rus klassik yozuvchisi." },
  { id: "cmu54g18p0033ovm4stbndlsc", name: "Emily Brontë", biography: "Ingliz yozuvchisi." },
  { id: "author-59", name: "Pirimqul Qodirov", biography: "O'zbek xalq yozuvchisi." },
];

const CATEGORIES = [
  { id: "cat-1", name: "Ommabop ilm-fan", slug: "ommabop-ilm-fan", description: "Ilmiy kitoblar oddiy tilda", icon: "🔬" },
  { id: "cat-2", name: "Badiiy adabiyot", slug: "badiiy-adabiyot", description: "Roman, hikoya, poemalar", icon: "📖" },
  { id: "cat-3", name: "O'zbek adabiyoti", slug: "ozbek-adabiyoti", description: "Milliy adabiyot namunalari", icon: "🇺🇿" },
  { id: "cat-4", name: "Fizika", slug: "fizika", description: "Fizika faniga oid kitoblar", icon: "⚛️" },
  { id: "cat-5", name: "Matematika", slug: "matematika", description: "Matematika faniga oid kitoblar", icon: "📐" },
  { id: "cat-6", name: "Ingliz tili", slug: "ingliz-tili", description: "Ingliz tili o'rganish kitoblari", icon: "🇬🇧" },
  { id: "cat-7", name: "Shaxsiy rivojlanish", slug: "shaxsiy-rivojlanish", description: "O'zini rivojlantirish kitoblari", icon: "🌱" },
  { id: "cat-8", name: "Tarix", slug: "tarix", description: "Tarixiy kitoblar", icon: "📜" },
];

// ── Real kutubxona fondi: [sarlavha, muqova fayli, muallif, betlar] ──
// Eslatma: faol fond zaif handybook importi orqali boshqariladi (PDF'li 22 kitob).
// Eski ziyouz statik katalogi (77 kitob) to'liq olib tashlandi — qayta seed'da
// qaytib kelmasligi uchun UZ_BOOKS bo'sh qoldirildi.
const UZ_BOOKS = [];

function authorNameOf(id) {
  return AUTHORS.find((a) => a.id === id)?.name ?? "Noma'lum muallif";
}

function buildDescription(authorId, title) {
  const name = authorNameOf(authorId);
  const t = title.toLowerCase();
  if (t.includes("roman")) {
    return `${name}ning "${title}" asari — o'zbek nasrining yirik romanlaridan biri. Kutubxona fondidan.`;
  }
  if (t.includes("hikoya")) {
    return `${name}ning "${title}" — hayotdan olingan iliq hikoyalar to'plami. Kutubxona fondidan.`;
  }
  if (t.includes("asarlar") || t.includes("saylanma") || t.includes("jild") || t.includes("tom")) {
    return `${name}ning "${title}" — ijodidan tanlangan asarlar to'plami. Kutubxona fondidan.`;
  }
  return `${name}ning "${title}" asari — o'zbek adabiyotining suyukli namunalaridan. Kutubxona fondidan.`;
}

// Haqiqiy fonde kitoblar handybook importi orqali yuklanadi (PDF + muqova bilan).
// UZ_BOOKS bo'sh — eski ziyouz statik katalogi (77 ta) to'liq olib tashlandi.
const BOOKS = [];

// ── Eski demo (placeholder) kitob va mualliflar ──
const OLD_BOOK_IDS = ["book-ali", ...Array.from({ length: 50 }, (_, i) => `book-${i + 1}`)];
const OLD_AUTHOR_IDS = [
  ...Array.from({ length: 28 }, (_, i) => `author-${i + 1}`),
  "author-peter-thiel",
  "author-ray-dalio",
  "author-jim-collins",
  "author-robert-kiyosaki",
  "author-eckhart-tolle",
  "author-cal-newport",
];

// Demo user (user-1) uchun o'qish progressi va sessiyalari - yutuqlar uchun
const DEMO_BOOK_IDS = [
  "cmu5ap9cs0003ov4c0vjy2qwu", "cmu5aptki0007ov4cwlue8vu9", "cmu5aq7jb000aov4cn7pcqayf",
  "cmu5aqcbc000eov4cf58mmj0s", "cmu5aqgvv000hov4c3wff5r39", "cmu5aqk3m000lov4ceeqc3d1v",
  "cmu5aqylo000pov4ciiacmqpj", "cmu5arn3n000tov4cp8zxl1d8", "cmu5as32t000xov4c4vo83c69",
  "cmu5as6e30011ov4ctfa9q5ia", "cmu5asbaq0015ov4ciwzggnzr", "cmu5asf0t0019ov4cnpwr02jv",
  "cmu5ash6a001cov4czithh6bq", "cmu5asvtu001gov4c4398gn69", "cmu5at0ph001jov4coo9pz8wn",
  "cmu5b00530003ovy8pyhe0erz", "cmu5b060x0006ovy8pz6jgbzp", "cmu5boua00003ova0to5pwpym",
  "cmu5boy6p0006ova0pd4hnokj", "cmu5bozy70009ova0b52ocien",
];

const READING_PROGRESS = DEMO_BOOK_IDS.map((bookId, i) => ({
  userId: "user-1",
  bookId,
  currentPage: i < 7 ? 999 : (i < 12 ? 200 : 50),
  progress: i < 7 ? 100 : (i < 12 ? 70 : 25),
  startedAt: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString(),
  lastReadAt: new Date(Date.now() - (1 - Math.min(i, 6)) * 24 * 60 * 60 * 1000).toISOString(),
  completedAt: i < 7 ? new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000).toISOString() : null,
}));

const BOOKMARKS = [
  { userId: "user-1", bookId: DEMO_BOOK_IDS[0], page: 25, note: "Yaxshi joy", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { userId: "user-1", bookId: DEMO_BOOK_IDS[1], page: 100, note: "Qiziqarli qism", createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
  { userId: "user-1", bookId: DEMO_BOOK_IDS[3], page: 50, note: "Eslab qolish kerak", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { userId: "user-1", bookId: DEMO_BOOK_IDS[5], page: 150, note: "Asosiy g'oya", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { userId: "user-1", bookId: DEMO_BOOK_IDS[8], page: 300, note: "Muammo yechimi", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
];
const FAVORITES = DEMO_BOOK_IDS.slice(0, 8).map((bookId, i) => ({
  userId: "user-1",
  bookId,
  createdAt: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000).toISOString(),
}));

// Sessiyalar - 30 kunlik faol o'qish (12 soatlik chegarani o'tish uchun uzun)
const SESSIONS_DATA = Array.from({ length: 30 }, (_, i) => ({
  userId: "user-1",
  bookId: DEMO_BOOK_IDS[i % DEMO_BOOK_IDS.length],
  startPage: i * 20 + 1,
  endPage: i * 20 + 25,
  pagesRead: 25,
  duration: 2400, // 40 daqiqa
  startedAt: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
}));

// ── Har bir asosiy kitobda kamida 2-3 baho bo'ladi, averages real ko'rinadi.
const RATING_USERS = ["user-1", "user-2", "user-3", "user-4", "user-5"];
const RATINGS = [];
DEMO_BOOK_IDS.slice(0, 15).forEach((bookId, i) => {
  for (let j = 0; j < 3; j++) {
    if ((i + j) % 4 === 3) continue;
    RATINGS.push({
      userId: RATING_USERS[(i + j) % RATING_USERS.length],
      bookId,
      rating: 4 + ((i + j) % 2),
    });
  }
});

const BANNERS = [
  { title: "Xush kelibsiz!", description: "MBSI Library — bilimga yo'l oching", imageUrl: "/api/files/covers/hb-3.jpg", link: "/", order: 1, isActive: true },
  { title: "Yangi kitoblar", description: "Eng so'nggi kitoblar bilan tanishing", imageUrl: "/api/files/covers/hb-3.jpg", link: "/books", order: 2, isActive: true },
  { title: "O'qishni boshlang", description: "3 ta kitobni bir vaqtda o'qishingiz mumkin", imageUrl: "/api/files/covers/hb-3.jpg", link: "/books", order: 3, isActive: true },
];

const RECOMMENDATIONS = [];

// ─── Seed Function ────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding MBSI Library database...\n");

  // 1. Users
  console.log("👤 Seeding users...");
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { id: u.id },
      create: { id: u.id, name: u.name, role: u.role, avatar: u.avatar, isActive: true },
      update: { name: u.name, role: u.role, avatar: u.avatar },
    });
  }
  console.log(`   ✅ ${USERS.length} users created`);

  // 2. Authors
  console.log("✍️  Seeding authors...");
  for (const a of AUTHORS) {
    await prisma.author.upsert({
      where: { id: a.id },
      create: { id: a.id, name: a.name, biography: a.biography },
      update: { name: a.name, biography: a.biography },
    });
  }
  console.log(`   ✅ ${AUTHORS.length} authors created`);

  // 3. Categories
  console.log("📂 Seeding categories...");
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: c.id },
      create: { id: c.id, name: c.name, slug: c.slug, description: c.description, icon: c.icon },
      update: { name: c.name, slug: c.slug, description: c.description, icon: c.icon },
    });
  }
  console.log(`   ✅ ${CATEGORIES.length} categories created`);

  // 4. Books
  console.log("📚 Seeding books...");
  for (const b of BOOKS) {
    const slug = slugify(b.title);
    await prisma.book.upsert({
      where: { id: b.id },
      create: {
        id: b.id,
        title: b.title,
        slug,
        description: b.description,
        coverUrl: b.coverUrl,
        pdfUrl: b.pdfUrl,
        language: b.language,
        totalPages: b.totalPages,
        authorId: b.authorId,
        categoryId: b.categoryId,
        isPublished: b.isPublished,
      },
      update: {
        title: b.title,
        slug,
        description: b.description,
        coverUrl: b.coverUrl,
        pdfUrl: b.pdfUrl,
        language: b.language,
        totalPages: b.totalPages,
        authorId: b.authorId,
        categoryId: b.categoryId,
        isPublished: b.isPublished,
      },
    });
  }
  console.log(`   ✅ ${BOOKS.length} books created`);

  // 4b. Eski demo (placeholder) kitoblarni o'chirish.
  // Bog'liq yozuvlar (progress, sessions, bookmarks, favorites, ratings,
  // reviews, recommendations, content) schema'da Cascade — avtomatik o'chadi.
  console.log("🧹 Removing old demo books...");
  const removedBooks = await prisma.book.deleteMany({
    where: {
      OR: [
        { id: { in: OLD_BOOK_IDS } },
        // Eski demo/import qoldiqlari: statik /covers/ muqovali, lekin
        // joriy katalogga (book-uz-*) kirmagan kitoblar.
        { id: { not: { startsWith: "book-uz-" } }, coverUrl: { startsWith: "/covers/" } },
      ],
    },
  });
  console.log(`   🗑️  Removed ${removedBooks.count} old demo books`);

  // 4c. Eski demo mualliflardan kitobsiz qolganlarini o'chirish.
  // Haqiqiy kitoblari bor mualliflarga tegmaydi.
  const removedAuthors = await prisma.author.deleteMany({
    where: { id: { in: OLD_AUTHOR_IDS }, books: { none: {} } },
  });
  console.log(`   🗑️  Removed ${removedAuthors.count} unused demo authors`);

  // 4d. Cleanup: test/dev ma'lumotlarini production'dan o'chirish.
  // "E2E Test" kategoriyasi va unga bog'langan test kitoblari foydalanuvchiga ko'rinmasligi kerak.
  console.log("🧹 Cleaning test data...");
  const testCategories = await prisma.category.findMany({
    where: { OR: [{ slug: "e2e-test" }, { name: { contains: "E2E", mode: "insensitive" } }] },
    select: { id: true, slug: true },
  });
  for (const tc of testCategories) {
    await prisma.book.deleteMany({ where: { categoryId: tc.id } });
    await prisma.category.delete({ where: { id: tc.id } });
    console.log(`   🗑️  Removed test category: ${tc.slug}`);
  }
  await prisma.book.deleteMany({ where: { title: { contains: "E2E", mode: "insensitive" } } });

  // 5. Reading Progress
  console.log("📖 Seeding reading progress...");
  for (const rp of READING_PROGRESS) {
    const book = BOOKS.find((b) => b.id === rp.bookId);
    const totalPages = book ? book.totalPages : 100;
    await prisma.readingProgress.upsert({
      where: { userId_bookId: { userId: rp.userId, bookId: rp.bookId } },
      create: {
        userId: rp.userId,
        bookId: rp.bookId,
        currentPage: rp.currentPage,
        progress: rp.progress,
        startedAt: iso(rp.startedAt),
        lastReadAt: iso(rp.lastReadAt),
        completedAt: rp.completedAt ? iso(rp.completedAt) : null,
      },
      update: {
        currentPage: rp.currentPage,
        progress: rp.progress,
        lastReadAt: iso(rp.lastReadAt),
        completedAt: rp.completedAt ? iso(rp.completedAt) : null,
      },
    });
  }
  console.log(`   ✅ ${READING_PROGRESS.length} reading progress entries created`);

  // 6. Reading Sessions (delete existing to stay idempotent)
  console.log("📊 Seeding reading sessions...");
  await prisma.readingSession.deleteMany();
  for (const s of SESSIONS_DATA) {
    await prisma.readingSession.create({
      data: {
        userId: s.userId,
        bookId: s.bookId,
        startPage: s.startPage,
        baselinePage: Math.min(s.startPage, s.endPage),
        endPage: s.endPage,
        pagesRead: s.pagesRead,
        duration: s.duration,
        startedAt: iso(s.startedAt),
        endedAt: new Date(iso(s.startedAt).getTime() + s.duration * 1000),
      },
    });
  }
  console.log(`   ✅ ${SESSIONS_DATA.length} reading sessions created`);

  // 7. Bookmarks
  console.log("🔖 Seeding bookmarks...");
  for (const bm of BOOKMARKS) {
    await prisma.bookmark.upsert({
      where: { userId_bookId_page: { userId: bm.userId, bookId: bm.bookId, page: bm.page } },
      create: {
        userId: bm.userId,
        bookId: bm.bookId,
        page: bm.page,
        note: bm.note,
        createdAt: iso(bm.createdAt),
      },
      update: { note: bm.note },
    });
  }
  console.log(`   ✅ ${BOOKMARKS.length} bookmarks created`);

  // 8. Favorites
  console.log("❤️  Seeding favorites...");
  for (const f of FAVORITES) {
    await prisma.favorite.upsert({
      where: { userId_bookId: { userId: f.userId, bookId: f.bookId } },
      create: { userId: f.userId, bookId: f.bookId, createdAt: iso(f.createdAt) },
      update: {},
    });
  }
  console.log(`   ✅ ${FAVORITES.length} favorites created`);

  // 9. Ratings
  console.log("⭐ Seeding ratings...");
  for (const r of RATINGS) {
    await prisma.rating.upsert({
      where: { userId_bookId: { userId: r.userId, bookId: r.bookId } },
      create: { userId: r.userId, bookId: r.bookId, rating: r.rating },
      update: { rating: r.rating },
    });
  }
  console.log(`   ✅ ${RATINGS.length} ratings created`);

  // 10. Banners (delete existing to stay idempotent)
  console.log("🖼️  Seeding banners...");
  await prisma.banner.deleteMany();
  for (const b of BANNERS) {
    await prisma.banner.create({
      data: {
        title: b.title,
        description: b.description,
        imageUrl: b.imageUrl,
        link: b.link,
        order: b.order,
        isActive: b.isActive,
      },
    });
  }
  console.log(`   ✅ ${BANNERS.length} banners created`);

  // 11. Recommendations (delete existing to stay idempotent)
  console.log("💡 Seeding recommendations...");
  await prisma.recommendation.deleteMany();
  for (const r of RECOMMENDATIONS) {
    await prisma.recommendation.create({
      data: {
        title: r.title,
        description: r.description,
        bookId: r.bookId,
        order: r.order,
        isActive: r.isActive,
      },
    });
  }
  console.log(`   ✅ ${RECOMMENDATIONS.length} recommendations created`);

  // 12. Audit Logs (sample admin actions, delete existing to stay idempotent)
  console.log("📝 Seeding audit logs...");
  await prisma.auditLog.deleteMany();
  const auditEntries = [];
  for (const a of auditEntries) {
    await prisma.auditLog.create({
      data: {
        userId: a.userId,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        metadata: a.metadata,
      },
    });
  }
  console.log(`   ✅ ${auditEntries.length} audit log entries created`);

  console.log("\n🎉 Database seeded successfully!\n");
  console.log("Summary:");
  console.log(`   👤 Users:          ${USERS.length}`);
  console.log(`   ✍️  Authors:        ${AUTHORS.length}`);
  console.log(`   📂 Categories:     ${CATEGORIES.length}`);
  console.log(`   📚 Books:          ${BOOKS.length}`);
  console.log(`   📖 Reading Progress: ${READING_PROGRESS.length}`);
  console.log(`   📊 Sessions:       ${SESSIONS_DATA.length}`);
  console.log(`   🔖 Bookmarks:      ${BOOKMARKS.length}`);
  console.log(`   ❤️  Favorites:      ${FAVORITES.length}`);
  console.log(`   ⭐ Ratings:        ${RATINGS.length}`);
  console.log(`   🖼️  Banners:        ${BANNERS.length}`);
  console.log(`   💡 Recommendations: ${RECOMMENDATIONS.length}`);
  console.log(`   📝 Audit Logs:     ${auditEntries.length}`);
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main()
    .catch((e) => {
      console.error("❌ Seed failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
