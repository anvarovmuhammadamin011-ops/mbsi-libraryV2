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
  { id: "author-peter-thiel", name: "Peter Thiel", biography: "German-American entrepreneur, co-founder of PayPal, author of Zero to One." },
  { id: "author-ray-dalio", name: "Ray Dalio", biography: "American investor and hedge fund manager, author of Principles." },
  { id: "author-jim-collins", name: "Jim Collins", biography: "American business consultant, author of Good to Great." },
  { id: "author-robert-kiyosaki", name: "Robert Kiyosaki", biography: "American businessman, author of Rich Dad Poor Dad." },
  { id: "author-eckhart-tolle", name: "Eckhart Tolle", biography: "German-born spiritual teacher, author of The Power of Now." },
  { id: "author-cal-newport", name: "Cal Newport", biography: "American computer science professor, author of Deep Work." },
  { id: "author-3", name: "Abdulla Qodiriy", biography: "Uzbek writer, playwright, publicist. Author of 'O'tkan Kunlar'." },
  { id: "author-4", name: "O'tkir Hoshimov", biography: "Uzbek writer, journalist, and playwright." },
  { id: "author-5", name: "Stephen Hawking", biography: "British theoretical physicist and cosmologist." },
  { id: "author-6", name: "Robin Sharma", biography: "Canadian lawyer and author of The Monk Who Sold His Ferrari." },
  { id: "author-7", name: "Dale Carnegie", biography: "American writer and lecturer, developer of courses in self-improvement." },
  { id: "author-8", name: "Norman Lewis", biography: "English linguist and author of vocabulary-building books." },
  { id: "author-9", name: "Paulo Coelho", biography: "Brazilian lyricist and novelist, author of The Alchemist." },
  { id: "author-10", name: "Mehmon Baxtiyorov", biography: "Uzbek educator and methodologist." },
  // ── To'g'ri mualliflar (avval noto'g'ri biriktirilgan kitoblar uchun) ──
  { id: "author-11", name: "Robert Kiyosaki", biography: "American businessman and author of Rich Dad Poor Dad." },
  { id: "author-12", name: "Peter Thiel", biography: "Entrepreneur and investor, author of Zero to One." },
  { id: "author-13", name: "Jim Collins", biography: "American researcher and author of Good to Great." },
  { id: "author-14", name: "Eric Ries", biography: "Entrepreneur and author of The Lean Startup." },
  { id: "author-15", name: "Ray Dalio", biography: "American investor and author of Principles." },
  { id: "author-16", name: "Eckhart Tolle", biography: "Spiritual teacher and author of The Power of Now." },
  { id: "author-17", name: "Simon Sinek", biography: "Author and speaker, author of Start with Why." },
  { id: "author-18", name: "David Goggins", biography: "Ultramarathon runner and author of Can't Hurt Me." },
  { id: "author-19", name: "Ryan Holiday", biography: "American author focused on stoicism (The Obstacle Is the Way, Ego Is the Enemy)." },
  { id: "author-20", name: "Cal Newport", biography: "Computer scientist and author of Deep Work." },
  { id: "author-21", name: "Daniel Kahneman", biography: "Psychologist and Nobel laureate, author of Thinking, Fast and Slow." },
  { id: "author-22", name: "Yuval Noah Harari", biography: "Historian and author of Sapiens." },
  { id: "author-23", name: "Robert Greene", biography: "American author, author of The 48 Laws of Power." },
  { id: "author-24", name: "Sun Tzu", biography: "Ancient Chinese strategist, author of The Art of War." },
  { id: "author-25", name: "Marcus Aurelius", biography: "Roman emperor and stoic philosopher, author of Meditations." },
  { id: "author-26", name: "Héctor García", biography: "Co-author of Ikigai: The Japanese Secret to a Long and Happy Life." },
  { id: "author-27", name: "Donella Meadows", biography: "Systems scientist, author of Thinking in Systems." },
  { id: "author-28", name: "Mirkarim Osim", biography: "Uzbek writer and historian, author of historical works." },
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
  // Original Ali book
  {
    id: "book-ali",
    title: "Ali va uning sarguzashtlari",
    description: "Ali — injiq va bilimga chanqoq bola. U kutubxonada topgan g'alati kitob orqali hayotini butunlay o'zgartiradi. Qat'iyat va mehnat bilan orzusiga erishadi.",
    coverUrl: "/covers/ali-kitobi.svg",
    pdfUrl: "pdfs/ali-kitobi.pdf",
    language: "UZ",
    totalPages: 5,
    authorId: "author-10",
    categoryId: "cat-2",
    isPublished: true,
    coinReward: 10,
  },
  // 50 new books
  {
    id: "book-1",
    title: "Atomic Habits",
    description: "Kichik o'zgarishlar katta natijalar beradi. Odatlarni shakllantirish va o'zgartirish haqida.",
    coverUrl: "/covers/book-1.svg",
    language: "EN",
    totalPages: 320,
    authorId: "author-1",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 15,
  },
  {
    id: "book-2",
    title: "The Alchemist",
    description: "Paulo Coelho ning mashhur romani. O'z orzusini izlovchi yosh cho'pon haqida.",
    coverUrl: "/covers/book-2.svg",
    language: "EN",
    totalPages: 208,
    authorId: "author-9",
    categoryId: "cat-2",
    isPublished: true,
    coinReward: 12,
  },
  {
    id: "book-3",
    title: "Deep Work",
    description: "Diqqatni jamlash va murakkab ishlarni bajarish san'ati.",
    coverUrl: "/covers/book-3.svg",
    language: "EN",
    totalPages: 296,
    authorId: "author-cal-newport",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 14,
  },
  {
    id: "book-4",
    title: "Thinking, Fast and Slow",
    description: "Ikki tizimli fikrlash haqida. Tez va sekin fikrlash orasidagi farq.",
    coverUrl: "/covers/book-4.svg",
    language: "EN",
    totalPages: 499,
    authorId: "author-cal-newport",
    categoryId: "cat-1",
    isPublished: true,
    coinReward: 18,
  },
  {
    id: "book-5",
    title: "Sapiens",
    description: "Insoniyat tarixi haqida. Oddiy hayvondan zamonaviy jamiyatgacha.",
    coverUrl: "/covers/book-5.svg",
    language: "EN",
    totalPages: 443,
    authorId: "author-22",
    categoryId: "cat-8",
    isPublished: true,
    coinReward: 20,
  },
  {
    id: "book-6",
    title: "The Monk Who Sold His Ferrari",
    description: "O'zini topish va haqiqiy baxtni izlash haqida hikoya.",
    coverUrl: "/covers/book-6.svg",
    language: "EN",
    totalPages: 208,
    authorId: "author-6",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 12,
  },
  {
    id: "book-7",
    title: "How to Win Friends",
    description: "Odamlar bilan qanday muloqot qilish va do'stlik qilish haqida.",
    coverUrl: "/covers/book-7.svg",
    language: "EN",
    totalPages: 320,
    authorId: "author-7",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 14,
  },
  {
    id: "book-8",
    title: "Word Power Made Easy",
    description: "Ingliz tilini boyitish va so'z zaxirasini oshirish uchun kitob.",
    coverUrl: "/covers/book-8.svg",
    language: "EN",
    totalPages: 480,
    authorId: "author-8",
    categoryId: "cat-6",
    isPublished: true,
    coinReward: 16,
  },
  {
    id: "book-9",
    title: "O'tkan Kunlar",
    description: "Abdulla Qodiriy ning mashhur romani. O'tgan kunlar xotirasi.",
    coverUrl: "/covers/book-9.svg",
    language: "UZ",
    totalPages: 350,
    authorId: "author-3",
    categoryId: "cat-3",
    isPublished: true,
    coinReward: 15,
  },
  {
    id: "book-10",
    title: "Jaynomad",
    description: "O'tkir Hoshimovning badiiy asari. Hayot haqida fikrlash.",
    coverUrl: "/covers/book-10.svg",
    language: "UZ",
    totalPages: 280,
    authorId: "author-4",
    categoryId: "cat-3",
    isPublished: true,
    coinReward: 13,
  },
  {
    id: "book-11",
    title: "A Brief History of Time",
    description: "Koinot haqida oddiy tilda. Stephen Hawking ning ilmiy asari.",
    coverUrl: "/covers/book-11.svg",
    language: "EN",
    totalPages: 256,
    authorId: "author-5",
    categoryId: "cat-1",
    isPublished: true,
    coinReward: 18,
  },
  {
    id: "book-12",
    title: "Jur'a Tandir",
    description: "Chingiz Aytmatov ning mashhur asari. O'rmon haqida.",
    coverUrl: "/covers/book-12.svg",
    language: "UZ",
    totalPages: 320,
    authorId: "author-2",
    categoryId: "cat-3",
    isPublished: true,
    coinReward: 14,
  },
  {
    id: "book-13",
    title: "Mental Arithmetic",
    description: "Aqliy hisoblash usullari. Matematik qobiliyatni rivojlantirish.",
    coverUrl: "/covers/book-13.svg",
    language: "UZ",
    totalPages: 180,
    authorId: "author-10",
    categoryId: "cat-5",
    isPublished: true,
    coinReward: 10,
  },
  {
    id: "book-14",
    title: "The Power of Now",
    description: "Hozirgi lahzani qadrlash va huzur ichida yashash.",
    coverUrl: "/covers/book-14.svg",
    language: "EN",
    totalPages: 236,
    authorId: "author-eckhart-tolle",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 12,
  },
  {
    id: "book-15",
    title: "Rich Dad Poor Dad",
    description: "Moliyaviy savodxonlik haqida. Boy va kambag'al otalar farqi.",
    coverUrl: "/covers/book-15.svg",
    language: "EN",
    totalPages: 336,
    authorId: "author-eckhart-tolle",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 15,
  },
  {
    id: "book-16",
    title: "The 48 Laws of Power",
    description: "Hokimiyat qonunlari. Tarixiy voqealar asosida.",
    coverUrl: "/covers/book-16.svg",
    language: "EN",
    totalPages: 499,
    authorId: "author-robert-kiyosaki",
    categoryId: "cat-8",
    isPublished: true,
    coinReward: 20,
  },
  {
    id: "book-17",
    title: "Start with Why",
    description: "Nima uchun degan savol bilan boshlash. Leadership haqida.",
    coverUrl: "/covers/book-17.svg",
    language: "EN",
    totalPages: 256,
    authorId: "author-17",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 13,
  },
  {
    id: "book-18",
    title: "Zero to One",
    description: "Startaplar haqida. Hech narsadan bir narsaga yaratish.",
    coverUrl: "/covers/book-18.svg",
    language: "EN",
    totalPages: 224,
    authorId: "author-peter-thiel",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 12,
  },
  {
    id: "book-19",
    title: "Good to Great",
    description: "Yaxshidan a'lo darajaga yetish. Biznes strategiyalari.",
    coverUrl: "/covers/book-19.svg",
    language: "EN",
    totalPages: 320,
    authorId: "author-peter-thiel",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 14,
  },
  {
    id: "book-20",
    title: "The Lean Startup",
    description: "Startap yaratishning zamonaviy usuli. Tezkor sinov va rivojlantirish.",
    coverUrl: "/covers/book-20.svg",
    language: "EN",
    totalPages: 336,
    authorId: "author-jim-collins",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 15,
  },
  {
    id: "book-21",
    title: "Thinking in Systems",
    description: "Tizimli fikrlash. Murakkab tuzilmalarni tushunish.",
    coverUrl: "/covers/book-21.svg",
    language: "EN",
    totalPages: 218,
    authorId: "author-27",
    categoryId: "cat-1",
    isPublished: true,
    coinReward: 12,
  },
  {
    id: "book-22",
    title: "The Art of War",
    description: "Sun Tzu ning urush san'ati. Harbiy strategiya.",
    coverUrl: "/covers/book-22.svg",
    language: "EN",
    totalPages: 128,
    authorId: "author-24",
    categoryId: "cat-8",
    isPublished: true,
    coinReward: 8,
  },
  {
    id: "book-23",
    title: "Meditations",
    description: "Mark Avreliyning meditatsiyalari. Stoik falsafa.",
    coverUrl: "/covers/book-23.svg",
    language: "EN",
    totalPages: 256,
    authorId: "author-25",
    categoryId: "cat-8",
    isPublished: true,
    coinReward: 13,
  },
  {
    id: "book-24",
    title: "The Obstacle Is the Way",
    description: "Qiyinchiliklarni imkoniyatga aylantirish. Stoik falsafa.",
    coverUrl: "/covers/book-24.svg",
    language: "EN",
    totalPages: 224,
    authorId: "author-19",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 12,
  },
  {
    id: "book-25",
    title: "Ego Is the Enemy",
    description: "Ego haqiqiy dushman. O'zini boshqarish haqida.",
    coverUrl: "/covers/book-25.svg",
    language: "EN",
    totalPages: 256,
    authorId: "author-19",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 13,
  },
  {
    id: "book-26",
    title: "Principles",
    description: "Hayot va biznes qoidalari. Ray Dalio tajribasi.",
    coverUrl: "/covers/book-26.svg",
    language: "EN",
    totalPages: 592,
    authorId: "author-ray-dalio",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 22,
  },
  {
    id: "book-27",
    title: "Can't Hurt Me",
    description: "David Goggins ning hayoti. Miskinlikdan g'alaba sari.",
    coverUrl: "/covers/book-27.svg",
    language: "EN",
    totalPages: 368,
    authorId: "author-ray-dalio",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 16,
  },
  {
    id: "book-28",
    title: "The 5 AM Club",
    description: "Erta turish odati. Samaradorlikni oshirish.",
    coverUrl: "/covers/book-28.svg",
    language: "EN",
    totalPages: 272,
    authorId: "author-6",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 13,
  },
  {
    id: "book-29",
    title: "Ikigai",
    description: "Yapon baxt falsafasi. Hayot maqsodini topish.",
    coverUrl: "/covers/book-29.svg",
    language: "EN",
    totalPages: 208,
    authorId: "author-26",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 11,
  },
  {
    id: "book-30",
    title: "Atomic Habits (Uzbek)",
    description: "Odatlarni shakllantirish. Kichik o'zgarishlar katta natijalar.",
    coverUrl: "/covers/book-30.svg",
    language: "UZ",
    totalPages: 320,
    authorId: "author-1",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 15,
  },
  {
    id: "book-31",
    title: "O'zbekiston Tarixi",
    description: "O'zbekiston respublikasining boy tarixi.",
    coverUrl: "/covers/book-31.svg",
    language: "UZ",
    totalPages: 400,
    authorId: "author-28",
    categoryId: "cat-8",
    isPublished: true,
    coinReward: 18,
  },
  {
    id: "book-32",
    title: "Matematika Asoslari",
    description: "Matematikaning asosiy tushunchalari va usullari.",
    coverUrl: "/covers/book-32.svg",
    language: "UZ",
    totalPages: 280,
    authorId: "author-10",
    categoryId: "cat-5",
    isPublished: true,
    coinReward: 14,
  },
  {
    id: "book-33",
    title: "Fizika Qonunlari",
    description: "Fizikaning asosiy qonunlari va formulalari.",
    coverUrl: "/covers/book-33.svg",
    language: "UZ",
    totalPages: 320,
    authorId: "author-5",
    categoryId: "cat-4",
    isPublished: true,
    coinReward: 15,
  },
  {
    id: "book-34",
    title: "Ingliz Tili Grammatikasi",
    description: "Ingliz tilining grammatik qoidalari.",
    coverUrl: "/covers/book-34.svg",
    language: "EN",
    totalPages: 350,
    authorId: "author-8",
    categoryId: "cat-6",
    isPublished: true,
    coinReward: 16,
  },
  {
    id: "book-35",
    title: "Adabiyot Tanlangan",
    description: "O'zbek va jahon adabiyotidan tanlangan asarlar.",
    coverUrl: "/covers/book-35.svg",
    language: "UZ",
    totalPages: 280,
    authorId: "author-4",
    categoryId: "cat-3",
    isPublished: true,
    coinReward: 14,
  },
  {
    id: "book-36",
    title: "Psixologiya Kirish",
    description: "Psixologiya fanining asoslari va tushunchalari.",
    coverUrl: "/covers/book-36.svg",
    language: "UZ",
    totalPages: 250,
    authorId: "author-7",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 13,
  },
  {
    id: "book-37",
    title: "Biznes Asoslari",
    description: "Biznes yuritishning asosiy qoidalari.",
    coverUrl: "/covers/book-37.svg",
    language: "EN",
    totalPages: 280,
    authorId: "author-11",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 14,
  },
  {
    id: "book-38",
    title: "Falsafa Lug'at",
    description: "Falsafiy atamalar va tushunchalar lug'ati.",
    coverUrl: "/covers/book-38.svg",
    language: "UZ",
    totalPages: 200,
    authorId: "author-10",
    categoryId: "cat-8",
    isPublished: true,
    coinReward: 11,
  },
  {
    id: "book-39",
    title: "Sun'iy Intellekt",
    description: "Sun'iy intellekt texnologiyalari va ularning rivojlanishi.",
    coverUrl: "/covers/book-39.svg",
    language: "EN",
    totalPages: 300,
    authorId: "author-20",
    categoryId: "cat-1",
    isPublished: true,
    coinReward: 15,
  },
  {
    id: "book-40",
    title: "Iqlim O'zgarishi",
    description: "Global iqlim o'zgarishi va uning ta'siri.",
    coverUrl: "/covers/book-40.svg",
    language: "EN",
    totalPages: 280,
    authorId: "author-5",
    categoryId: "cat-1",
    isPublished: true,
    coinReward: 14,
  },
  {
    id: "book-41",
    title: "Biologiya",
    description: "Biologiya fanining asoslari.",
    coverUrl: "/covers/book-41.svg",
    language: "UZ",
    totalPages: 350,
    authorId: "author-10",
    categoryId: "cat-1",
    isPublished: true,
    coinReward: 16,
  },
  {
    id: "book-42",
    title: "Kimyo Asoslari",
    description: "Kimyo fanining asosiy tushunchalari.",
    coverUrl: "/covers/book-42.svg",
    language: "UZ",
    totalPages: 300,
    authorId: "author-10",
    categoryId: "cat-1",
    isPublished: true,
    coinReward: 15,
  },
  {
    id: "book-43",
    title: "Geografiya",
    description: "Geografiya fanining asoslari.",
    coverUrl: "/covers/book-43.svg",
    language: "UZ",
    totalPages: 280,
    authorId: "author-10",
    categoryId: "cat-1",
    isPublished: true,
    coinReward: 14,
  },
  {
    id: "book-44",
    title: "Informatika",
    description: "Informatika va kompyuter fanlari.",
    coverUrl: "/covers/book-44.svg",
    language: "UZ",
    totalPages: 320,
    authorId: "author-10",
    categoryId: "cat-5",
    isPublished: true,
    coinReward: 15,
  },
  {
    id: "book-45",
    title: "Tarixiy Asarlar",
    description: "Tarixiy voqealar haqida to'plam.",
    coverUrl: "/covers/book-45.svg",
    language: "UZ",
    totalPages: 350,
    authorId: "author-28",
    categoryId: "cat-8",
    isPublished: true,
    coinReward: 16,
  },
  {
    id: "book-46",
    title: "Zamonaviy Adabiyot",
    description: "Zamonaviy yozuvchilar asarlari to'plami.",
    coverUrl: "/covers/book-46.svg",
    language: "UZ",
    totalPages: 280,
    authorId: "author-4",
    categoryId: "cat-2",
    isPublished: true,
    coinReward: 14,
  },
  {
    id: "book-47",
    title: "Ilmiy Kashfiyotlar",
    description: "Ilmiy kashfiyotlar va ularning ahamiyati.",
    coverUrl: "/covers/book-47.svg",
    language: "EN",
    totalPages: 300,
    authorId: "author-5",
    categoryId: "cat-1",
    isPublished: true,
    coinReward: 15,
  },
  {
    id: "book-48",
    title: "Moliya Boshqaruvi",
    description: "Shaxsiy moliyani boshqarish usullari.",
    coverUrl: "/covers/book-48.svg",
    language: "EN",
    totalPages: 250,
    authorId: "author-11",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 13,
  },
  {
    id: "book-49",
    title: "Muloqot San'ati",
    description: "Odamlar bilan samarali muloqot qilish.",
    coverUrl: "/covers/book-49.svg",
    language: "EN",
    totalPages: 280,
    authorId: "author-7",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 14,
  },
  {
    id: "book-50",
    title: "Hayot Falsafasi",
    description: "Hayot maqonini topish va baxtli yashash.",
    coverUrl: "/covers/book-50.svg",
    language: "EN",
    totalPages: 220,
    authorId: "author-19",
    categoryId: "cat-7",
    isPublished: true,
    coinReward: 12,
  },
];

const READING_PROGRESS = [];
const BOOKMARKS = [];
const FAVORITES = [];
// ── Boshlang'ich reytinglar: bosh sahifadagi "—" muammosini yechish uchun.
// ── Har bir asosiy kitobda kamida 2-3 baho bo'ladi, averages real ko'rinadi.
const RATINGS = [
  { userId: "user-1", bookId: "book-1", rating: 5 },
  { userId: "user-2", bookId: "book-1", rating: 5 },
  { userId: "user-3", bookId: "book-1", rating: 4 },
  { userId: "user-1", bookId: "book-2", rating: 5 },
  { userId: "user-4", bookId: "book-2", rating: 5 },
  { userId: "user-2", bookId: "book-3", rating: 4 },
  { userId: "user-3", bookId: "book-3", rating: 5 },
  { userId: "user-1", bookId: "book-4", rating: 5 },
  { userId: "user-5", bookId: "book-4", rating: 4 },
  { userId: "user-2", bookId: "book-5", rating: 5 },
  { userId: "user-3", bookId: "book-5", rating: 5 },
  { userId: "user-1", bookId: "book-6", rating: 4 },
  { userId: "user-4", bookId: "book-6", rating: 5 },
  { userId: "user-2", bookId: "book-7", rating: 4 },
  { userId: "user-5", bookId: "book-7", rating: 5 },
  { userId: "user-3", bookId: "book-9", rating: 5 },
  { userId: "user-1", bookId: "book-9", rating: 5 },
  { userId: "user-2", bookId: "book-11", rating: 5 },
  { userId: "user-4", bookId: "book-11", rating: 4 },
  { userId: "user-1", bookId: "book-15", rating: 5 },
  { userId: "user-2", bookId: "book-15", rating: 4 },
  { userId: "user-3", bookId: "book-15", rating: 5 },
  { userId: "user-1", bookId: "book-18", rating: 5 },
  { userId: "user-4", bookId: "book-18", rating: 4 },
  { userId: "user-2", bookId: "book-19", rating: 4 },
  { userId: "user-5", bookId: "book-19", rating: 5 },
  { userId: "user-1", bookId: "book-20", rating: 4 },
  { userId: "user-3", bookId: "book-20", rating: 5 },
  { userId: "user-2", bookId: "book-26", rating: 5 },
  { userId: "user-4", bookId: "book-26", rating: 5 },
  { userId: "user-1", bookId: "book-27", rating: 5 },
  { userId: "user-5", bookId: "book-27", rating: 4 },
  { userId: "user-3", bookId: "book-14", rating: 4 },
  { userId: "user-4", bookId: "book-14", rating: 5 },
  { userId: "user-2", bookId: "book-17", rating: 4 },
  { userId: "user-1", bookId: "book-29", rating: 5 },
  { userId: "user-3", bookId: "book-29", rating: 4 },
];
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
        coinReward: b.coinReward ?? 10,
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
        coinReward: b.coinReward ?? 10,
      },
    });
  }
  console.log(`   ✅ ${BOOKS.length} books created`);

  // 4b. Cleanup: test/dev ma'lumotlarini production'dan o'chirish.
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

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
