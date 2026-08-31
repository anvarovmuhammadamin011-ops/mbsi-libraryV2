// ============================================================
// MBSI Library — Database Seed Script
// ============================================================
// Populates the SQLite database with demo data for development.
// Run: npm run db:seed
// ============================================================

import { PrismaClient } from "@prisma/client";

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

const AUTHORS = [
  { id: "author-1", name: "James Clear", biography: "American author and speaker known for his work on habits and decision-making." },
  { id: "author-2", name: "Chingiz Aytmatov", biography: "Kyrgyz author who wrote in both Russian and Kyrgyz." },
  { id: "author-3", name: "Abdulla Qodiriy", biography: "Uzbek writer, playwright, publicist. Author of 'O'tkan Kunlar'." },
  { id: "author-4", name: "O'tkir Hoshimov", biography: "Uzbek writer, journalist, and playwright." },
  { id: "author-5", name: "Stephen Hawking", biography: "British theoretical physicist and cosmologist." },
  { id: "author-6", name: "Robin Sharma", biography: "Canadian lawyer and author of The Monk Who Sold His Ferrari." },
  { id: "author-7", name: "Dale Carnegie", biography: "American writer and lecturer, developer of courses in self-improvement." },
  { id: "author-8", name: "Norman Lewis", biography: "English linguist and author of vocabulary-building books." },
  { id: "author-9", name: "Paulo Coelho", biography: "Brazilian lyricist and novelist, author of The Alchemist." },
  { id: "author-10", name: "Mehmon Baxtiyorov", biography: "Uzbek educator and methodologist." },
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

// Demo kitoblar o'chirildi - faqat real kitoblar qo'shilishi kerak
const BOOKS = [];

const READING_PROGRESS = [];
const BOOKMARKS = [];
const FAVORITES = [];
const RATINGS = [];
const SESSIONS_DATA = [];

const BANNERS = [
  { title: "Xush kelibsiz!", description: "MBSI Library — bilimga yo'l oching", imageUrl: "/covers/atomic-habits.svg", link: "/", order: 1, isActive: true },
  { title: "Yangi kitoblar", description: "Eng so'nggi kitoblar bilan tanishing", imageUrl: "/covers/alchemist.svg", link: "/books", order: 2, isActive: true },
  { title: "O'qishni boshlang", description: "3 ta kitobni bir vaqtda o'qishingiz mumkin", imageUrl: "/covers/deep-work.svg", link: "/books", order: 3, isActive: true },
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

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
