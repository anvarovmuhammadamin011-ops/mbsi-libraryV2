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

const BOOKS = [
  {
    id: "book-1", title: "Atomic Habits", description: "Atomic Habits by James Clear is a revolutionary book that teaches you how to build good habits and break bad ones. The book explains how habits shape your identity and how you can use the Four Laws of Behavior Change to build better habits that stick.",
    coverUrl: "/covers/atomic-habits.svg", pdfUrl: "pdfs/book-1.pdf", language: "EN", totalPages: 15, authorId: "author-1", categoryId: "cat-7", isPublished: true,
  },
  {
    id: "book-2", title: "O'tkan Kunlar", description: "Abdulla Qodiriyning 'O'tkan Kunlar' romani o'zbek adabiyotining eng mashhur asarlaridan biri. U 1920-yillardagi O'zbekiston hayotini aks ettiradi.",
    coverUrl: "/covers/otkan-kunlar.svg", pdfUrl: "pdfs/book-2.pdf", language: "UZ", totalPages: 12, authorId: "author-3", categoryId: "cat-3", isPublished: true,
  },
  {
    id: "book-3", title: "Fizika 9-sinf", description: "O'zbekiston Respublikasi oliy ta'lim, fan va innovatsiyalar vazirligi tomonidan tasdiqlangan darslik.",
    coverUrl: "/covers/fizika-9.svg", pdfUrl: "pdfs/book-3.pdf", language: "UZ", totalPages: 20, authorId: "author-10", categoryId: "cat-4", isPublished: true,
  },
  {
    id: "book-4", title: "Jismoniy tarbiya 8-sinf", description: "Maktablarda jismoniy tarbiya fani uchun darslik.",
    coverUrl: "/covers/jismoniy-tarbiya.svg", pdfUrl: "pdfs/book-4.pdf", language: "UZ", totalPages: 15, authorId: "author-10", categoryId: "cat-4", isPublished: true,
  },
  {
    id: "book-5", title: "A Brief History of Time", description: "Stephen Hawking's bestselling book explains complex cosmological concepts to the general reader, covering topics from the Big Bang to black holes.",
    coverUrl: "/covers/brief-history.svg", pdfUrl: "pdfs/book-5.pdf", language: "EN", totalPages: 18, authorId: "author-5", categoryId: "cat-1", isPublished: true,
  },
  {
    id: "book-6", title: "The Monk Who Sold His Ferrari", description: "A fable about fulfilling your dreams and reaching your destiny. Robin Sharma tells the story of a lawyer who gives up everything to find true happiness.",
    coverUrl: "/covers/monk-ferrari.svg", pdfUrl: "pdfs/book-6.pdf", language: "EN", totalPages: 16, authorId: "author-6", categoryId: "cat-7", isPublished: true,
  },
  {
    id: "book-7", title: "How to Win Friends and Influence People", description: "Dale Carnegie's timeless guide to interpersonal relationships, communication, and leadership skills.",
    coverUrl: "/covers/win-friends.svg", pdfUrl: "pdfs/book-7.pdf", language: "EN", totalPages: 857, authorId: "author-7", categoryId: "cat-7", isPublished: true,
  },
  {
    id: "book-8", title: "Word Power Made Easy", description: "Norman Lewis's classic vocabulary builder that has helped millions improve their English vocabulary and communication skills.",
    coverUrl: "/covers/word-power.svg", pdfUrl: "pdfs/book-8.pdf", language: "EN", totalPages: 22, authorId: "author-8", categoryId: "cat-6", isPublished: true,
  },
  {
    id: "book-9", title: "The Art of War", description: "Sun Tzu's ancient Chinese treatise on military strategy, widely used in business and leadership.",
    coverUrl: "/covers/alchemist.svg", pdfUrl: "pdfs/book-9.pdf", language: "EN", totalPages: 25, authorId: "author-9", categoryId: "cat-2", isPublished: true,
  },
  {
    id: "book-10", title: "Matematika 7-sinf", description: "O'zbekiston maktablari uchun matematika darslik.",
    coverUrl: "/covers/matematika-7.svg", pdfUrl: "pdfs/book-10.pdf", language: "UZ", totalPages: 18, authorId: "author-10", categoryId: "cat-5", isPublished: true,
  },
  {
    id: "book-11", title: "Jannatda Ikki Boshli Qush", description: "Chingiz Aytmatovning mashhur asari. Qadimiy urf-odatlar va zamonaviy hayot o'rtasidagi ziddiyat haqida.",
    coverUrl: "/covers/jannatda-qush.svg", pdfUrl: "pdfs/book-11.pdf", language: "UZ", totalPages: 14, authorId: "author-2", categoryId: "cat-2", isPublished: true,
  },
  {
    id: "book-12", title: "Dunyoning Ishlari", description: "O'tkir Hoshimovning 'Dunyoning Ishlari' romani — o'zbek adabiyotining yorqin namunasi.",
    coverUrl: "/covers/dunyoning-ishlari.svg", pdfUrl: "pdfs/book-12.pdf", language: "UZ", totalPages: 20, authorId: "author-4", categoryId: "cat-3", isPublished: true,
  },
  {
    id: "book-13", title: "Fizika 8-sinf", description: "O'zbekiston Respublikasi oliy ta'lim, fan va innovatsiyalar vazirligi tomonidan tasdiqlangan 8-sinf fizika darsligi.",
    coverUrl: "/covers/fizika-8.svg", pdfUrl: "pdfs/book-13.pdf", language: "UZ", totalPages: 17, authorId: "author-10", categoryId: "cat-4", isPublished: true,
  },
  {
    id: "book-14", title: "Matematika 9-sinf", description: "O'zbekiston maktablari uchun 9-sinf matematika darslik.",
    coverUrl: "/covers/matematika-9.svg", pdfUrl: "pdfs/book-14.pdf", language: "UZ", totalPages: 19, authorId: "author-10", categoryId: "cat-5", isPublished: true,
  },
  {
    id: "book-15", title: "Ingliz tili 5-sinf", description: "Maktablarda ingliz tili fani uchun darslik.",
    coverUrl: "/covers/ingliz-tili-5.svg", pdfUrl: "pdfs/book-15.pdf", language: "UZ", totalPages: 12, authorId: "author-10", categoryId: "cat-6", isPublished: true,
  },
  {
    id: "book-16", title: "Deep Work", description: "Cal Newport explores how focused work can lead to professional success and personal fulfillment in an increasingly distracted world.",
    coverUrl: "/covers/deep-work.svg", pdfUrl: "pdfs/book-16.pdf", language: "EN", totalPages: 20, authorId: "author-6", categoryId: "cat-7", isPublished: true,
  },
  {
    id: "book-17", title: "O'zbekiston Tarixi", description: "O'zbekistonning boy tarixi haqida batafsil kitob.",
    coverUrl: "/covers/ozbek-tarixi.svg", pdfUrl: "pdfs/book-17.pdf", language: "UZ", totalPages: 25, authorId: "author-10", categoryId: "cat-8", isPublished: true,
  },
  {
    id: "book-18", title: "Think and Grow Rich", description: "Napoleon Hill's classic personal development and self-help book that has helped millions achieve financial success.",
    coverUrl: "/covers/think-grow-rich.svg", pdfUrl: "pdfs/book-18.pdf", language: "EN", totalPages: 1268, authorId: "author-7", categoryId: "cat-7", isPublished: true,
  },
  {
    id: "book-19", title: "Rus tili 6-sinf", description: "Maktablarda rus tili fani uchun darslik.",
    coverUrl: "/covers/rus-tili-6.svg", pdfUrl: "pdfs/book-19.pdf", language: "RU", totalPages: 16, authorId: "author-10", categoryId: "cat-6", isPublished: true,
  },
  {
    id: "book-20", title: "Biologiya 7-sinf", description: "O'zbekiston maktablari uchun biologiya darslik.",
    coverUrl: "/covers/biologiya-7.svg", pdfUrl: "pdfs/book-20.pdf", language: "UZ", totalPages: 18, authorId: "author-10", categoryId: "cat-1", isPublished: true,
  },
];

const READING_PROGRESS = [
  { userId: "user-1", bookId: "book-1", currentPage: 2, progress: 33, startedAt: "2025-09-10T08:00:00Z", lastReadAt: "2025-09-20T14:30:00Z", completedAt: null },
  { userId: "user-1", bookId: "book-2", currentPage: 3, progress: 60, startedAt: "2025-09-05T10:00:00Z", lastReadAt: "2025-09-19T16:00:00Z", completedAt: null },
  { userId: "user-1", bookId: "book-3", currentPage: 1, progress: 20, startedAt: "2025-09-15T09:00:00Z", lastReadAt: "2025-09-18T11:00:00Z", completedAt: null },
  { userId: "user-2", bookId: "book-1", currentPage: 4, progress: 67, startedAt: "2025-09-08T12:00:00Z", lastReadAt: "2025-09-20T18:00:00Z", completedAt: null },
  { userId: "user-3", bookId: "book-9", currentPage: 5, progress: 100, startedAt: "2025-09-01T10:00:00Z", lastReadAt: "2025-09-15T20:00:00Z", completedAt: "2025-09-15T20:00:00Z" },
  { userId: "user-2", bookId: "book-5", currentPage: 2, progress: 40, startedAt: "2025-09-12T08:00:00Z", lastReadAt: "2025-09-20T10:00:00Z", completedAt: null },
  { userId: "user-3", bookId: "book-7", currentPage: 2, progress: 50, startedAt: "2025-09-14T09:00:00Z", lastReadAt: "2025-09-19T15:00:00Z", completedAt: null },
  { userId: "user-4", bookId: "book-6", currentPage: 5, progress: 100, startedAt: "2025-09-03T07:00:00Z", lastReadAt: "2025-09-10T20:00:00Z", completedAt: "2025-09-10T20:00:00Z" },
  { userId: "user-4", bookId: "book-11", currentPage: 3, progress: 60, startedAt: "2025-09-11T10:00:00Z", lastReadAt: "2025-09-18T12:00:00Z", completedAt: null },
  { userId: "user-5", bookId: "book-16", currentPage: 3, progress: 60, startedAt: "2025-09-07T08:00:00Z", lastReadAt: "2025-09-20T16:00:00Z", completedAt: null },
  { userId: "user-6", bookId: "book-8", currentPage: 1, progress: 25, startedAt: "2025-09-09T14:00:00Z", lastReadAt: "2025-09-19T09:00:00Z", completedAt: null },
  { userId: "user-7", bookId: "book-18", currentPage: 2, progress: 40, startedAt: "2025-09-13T11:00:00Z", lastReadAt: "2025-09-18T17:00:00Z", completedAt: null },
];

const BOOKMARKS = [
  { userId: "user-1", bookId: "book-1", page: 50, note: "Asosiy g'oya", createdAt: "2025-09-12T10:00:00Z" },
  { userId: "user-1", bookId: "book-1", page: 100, note: "4 qonun", createdAt: "2025-09-15T14:00:00Z" },
  { userId: "user-1", bookId: "book-2", page: 45, note: null, createdAt: "2025-09-08T09:00:00Z" },
  { userId: "user-2", bookId: "book-5", page: 30, note: "Big Bang", createdAt: "2025-09-13T08:00:00Z" },
  { userId: "user-3", bookId: "book-7", page: 75, note: "Communication tips", createdAt: "2025-09-15T10:00:00Z" },
  { userId: "user-4", bookId: "book-11", page: 40, note: null, createdAt: "2025-09-12T11:00:00Z" },
  { userId: "user-5", bookId: "book-16", page: 100, note: "Deep work rules", createdAt: "2025-09-09T10:00:00Z" },
];

const FAVORITES = [
  { userId: "user-1", bookId: "book-1", createdAt: "2025-09-10T08:00:00Z" },
  { userId: "user-1", bookId: "book-2", createdAt: "2025-09-05T10:00:00Z" },
  { userId: "user-1", bookId: "book-9", createdAt: "2025-09-16T09:00:00Z" },
  { userId: "user-2", bookId: "book-9", createdAt: "2025-09-08T12:00:00Z" },
  { userId: "user-2", bookId: "book-5", createdAt: "2025-09-12T08:00:00Z" },
  { userId: "user-3", bookId: "book-7", createdAt: "2025-09-14T09:00:00Z" },
  { userId: "user-3", bookId: "book-9", createdAt: "2025-09-01T10:00:00Z" },
  { userId: "user-4", bookId: "book-6", createdAt: "2025-09-03T07:00:00Z" },
  { userId: "user-5", bookId: "book-16", createdAt: "2025-09-07T08:00:00Z" },
  { userId: "user-5", bookId: "book-18", createdAt: "2025-09-10T11:00:00Z" },
];

const RATINGS = [
  { userId: "user-1", bookId: "book-1", rating: 5 },
  { userId: "user-1", bookId: "book-2", rating: 5 },
  { userId: "user-1", bookId: "book-3", rating: 4 },
  { userId: "user-2", bookId: "book-1", rating: 4 },
  { userId: "user-2", bookId: "book-5", rating: 5 },
  { userId: "user-3", bookId: "book-9", rating: 5 },
  { userId: "user-3", bookId: "book-7", rating: 4 },
  { userId: "user-4", bookId: "book-6", rating: 5 },
  { userId: "user-4", bookId: "book-11", rating: 4 },
  { userId: "user-5", bookId: "book-16", rating: 4 },
  { userId: "user-5", bookId: "book-18", rating: 5 },
  { userId: "user-6", bookId: "book-8", rating: 4 },
  { userId: "user-7", bookId: "book-18", rating: 4 },
];

// Reading sessions — generate realistic session data for ranking
// Each user gets multiple sessions across different books/days
const SESSIONS_DATA = [
  // user-1
  { userId: "user-1", bookId: "book-1", startPage: 1, endPage: 2, pagesRead: 2, duration: 720, startedAt: "2025-09-10T08:00:00Z" },
  { userId: "user-1", bookId: "book-2", startPage: 1, endPage: 3, pagesRead: 3, duration: 1080, startedAt: "2025-09-05T10:00:00Z" },
  { userId: "user-1", bookId: "book-3", startPage: 1, endPage: 1, pagesRead: 1, duration: 300, startedAt: "2025-09-15T09:00:00Z" },
  { userId: "user-1", bookId: "book-7", startPage: 1, endPage: 4, pagesRead: 4, duration: 1200, startedAt: "2025-08-01T08:00:00Z" },
  // user-2
  { userId: "user-2", bookId: "book-1", startPage: 1, endPage: 4, pagesRead: 4, duration: 1440, startedAt: "2025-09-08T12:00:00Z" },
  { userId: "user-2", bookId: "book-5", startPage: 1, endPage: 2, pagesRead: 2, duration: 600, startedAt: "2025-09-12T08:00:00Z" },
  { userId: "user-2", bookId: "book-9", startPage: 1, endPage: 5, pagesRead: 5, duration: 1500, startedAt: "2025-08-05T10:00:00Z" },
  // user-3
  { userId: "user-3", bookId: "book-9", startPage: 1, endPage: 5, pagesRead: 5, duration: 1500, startedAt: "2025-09-01T10:00:00Z" },
  { userId: "user-3", bookId: "book-7", startPage: 1, endPage: 2, pagesRead: 2, duration: 900, startedAt: "2025-09-14T09:00:00Z" },
  { userId: "user-3", bookId: "book-2", startPage: 1, endPage: 5, pagesRead: 5, duration: 1500, startedAt: "2025-08-01T10:00:00Z" },
  // user-4
  { userId: "user-4", bookId: "book-6", startPage: 1, endPage: 5, pagesRead: 5, duration: 1200, startedAt: "2025-09-03T07:00:00Z" },
  { userId: "user-4", bookId: "book-11", startPage: 1, endPage: 3, pagesRead: 3, duration: 480, startedAt: "2025-09-11T10:00:00Z" },
  // user-5
  { userId: "user-5", bookId: "book-16", startPage: 1, endPage: 3, pagesRead: 3, duration: 600, startedAt: "2025-09-07T08:00:00Z" },
  { userId: "user-5", bookId: "book-18", startPage: 1, endPage: 2, pagesRead: 2, duration: 400, startedAt: "2025-09-10T11:00:00Z" },
  // user-6
  { userId: "user-6", bookId: "book-8", startPage: 1, endPage: 1, pagesRead: 1, duration: 300, startedAt: "2025-09-09T14:00:00Z" },
  { userId: "user-6", bookId: "book-7", startPage: 1, endPage: 2, pagesRead: 2, duration: 600, startedAt: "2025-08-15T08:00:00Z" },
  // user-7
  { userId: "user-7", bookId: "book-18", startPage: 1, endPage: 2, pagesRead: 2, duration: 400, startedAt: "2025-09-13T11:00:00Z" },
];

const BANNERS = [
  { title: "Xush kelibsiz!", description: "MBSI Library — bilimga yo'l oching", imageUrl: "/covers/atomic-habits.svg", link: "/", order: 1, isActive: true },
  { title: "Yangi kitoblar", description: "Eng so'nggi kitoblar bilan tanishing", imageUrl: "/covers/alchemist.svg", link: "/books", order: 2, isActive: true },
  { title: "O'qishni boshlang", description: "3 ta kitobni bir vaqtda o'qishingiz mumkin", imageUrl: "/covers/deep-work.svg", link: "/books", order: 3, isActive: true },
];

const RECOMMENDATIONS = [
  { title: "Haftaning tavsiyasi", description: "Bu hafta eng ko'p o'qilgan kitob", bookId: "book-1", order: 1, isActive: true },
  { title: "Yangi kitoblar", description: "Yangi qo'shilgan kitoblar", bookId: "book-16", order: 2, isActive: true },
  { title: "O'quvchilar uchun", description: "O'quvchilarga tavsiya etilgan kitoblar", bookId: "book-9", order: 3, isActive: true },
  { title: "O'qituvchilar uchun", description: "O'qituvchilarga tavsiya etilgan kitoblar", bookId: "book-7", order: 4, isActive: true },
];

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
  const auditEntries = [
    { userId: "user-8", action: "CREATE_BOOK", entity: "Book", entityId: "book-1", metadata: { title: "Atomic Habits", published: true } },
    { userId: "user-8", action: "CREATE_BOOK", entity: "Book", entityId: "book-2", metadata: { title: "O'tkan Kunlar", published: true } },
    { userId: "user-8", action: "PUBLISH_BOOK", entity: "Book", entityId: "book-16", metadata: { title: "Deep Work" } },
    { userId: "user-8", action: "CREATE_USER", entity: "User", entityId: "user-1", metadata: { name: "Muhammadamin Toshtemirov", role: "STUDENT" } },
    { userId: "user-8", action: "UPDATE_BOOK", entity: "Book", entityId: "book-3", metadata: { title: "Fizika 9-sinf" } },
  ];
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
