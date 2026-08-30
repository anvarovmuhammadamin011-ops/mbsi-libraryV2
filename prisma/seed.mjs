// ============================================================
// MBSI Library — Database Seed Script
// ============================================================
// Populates the PostgreSQL database with data for development.
// 250 children's books sourced from ziyouz.com kutubxonasi.
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
  // Original authors
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
  // ─── Children's book authors from ziyouz.com ───
  { id: "author-11", name: "Abdurahmon Akbar", biography: "O'zbek yozuvchisi, bolalar uchun asarlar muallifi." },
  { id: "author-12", name: "Aleksandr Pushkin", biography: "Buyuk rus shoiri va yozuvchisi, ertaklari butun dunyoda mashhur." },
  { id: "author-13", name: "Alisher Navoiy", biography: "Buyuk o'zbek shoiri va mutafakkiri, chag'atoy adabiyotining asoschisi." },
  { id: "author-14", name: "Alisher Sa'dulla", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-15", name: "Anatoliy Aleksin", biography: "Sovet yozuvchisi, bolalar va o'smirlar uchun asarlar yozgan." },
  { id: "author-16", name: "Anatoliy Ribakov", biography: "Sovet yozuvchisi, bolalar uchun hikoyalar yozgan." },
  { id: "author-17", name: "Antuan de Sent-Ekzyuperi", biography: "Fransuz yozuvchisi, 'Kichkina shahzoda' asari muallifi." },
  { id: "author-18", name: "Anvar Obidjon", biography: "O'zbek bolalar yozuvchisi, hikoya va qissalar muallifi." },
  { id: "author-19", name: "Astrid Lindgren", biography: "Shvetsiyalik bolalar yozuvchisi, 'Mittivoy va Karlson' asari muallifi." },
  { id: "author-20", name: "Aziz Nesin", biography: "Turk yozuvchisi, satira va hikoyalar yozgan." },
  { id: "author-21", name: "Bibisora Otayeva", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-22", name: "Boris Pak", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-23", name: "Edith Shrayber Vike", biography: "Nemis bolalar yozuvchisi." },
  { id: "author-24", name: "Eduard Vovrushka", biography: "Sovet bolalar yozuvchisi, ertaklar muallifi." },
  { id: "author-25", name: "Ergash Raimov", biography: "O'zbek bolalar shoiri." },
  { id: "author-26", name: "Erkin Malik", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-27", name: "Erkin Vohidov", biography: "O'zbek shoiri, 'Mening yulduzim' asari bolalar uchun." },
  { id: "author-28", name: "Farhod Musajonov", biography: "O'zbek bolalar yozuvchisi, qissalar muallifi." },
  { id: "author-29", name: "Farid Usmon", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-30", name: "Frensis Bret-Gart", biography: "Amerikalik yozuvchi, 'Cho'ldan topilgan bola' asari bolalar uchun." },
  { id: "author-31", name: "G'afur G'ulom", biography: "O'zbek shoiri va tarjimon, bolalar uchun she'rlar yozgan." },
  { id: "author-32", name: "Gans Xristian Andersen", biography: "Daniyalik ertakchi, dunyodagi eng mashhur bolalar yozuvchisi." },
  { id: "author-33", name: "Hamid Olimjon", biography: "O'zbek shoiri, 'Oygul va Baxtiyor' dostoni bolalar uchun." },
  { id: "author-34", name: "Ivan Turgenev", biography: "Buyuk rus yozuvchisi." },
  { id: "author-35", name: "Janni Rodari", biography: "Italiyalik bolalar yozuvchisi, 'Jelsomino' asari muallifi." },
  { id: "author-36", name: "Jek London", biography: "Amerikalik yozuvchi." },
  { id: "author-37", name: "Jo'ldasboy Dilmuratov", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-38", name: "Jonatan Svift", biography: "Irlandiyalik yozuvchi, 'Gulliverning sayohatlari' muallifi." },
  { id: "author-39", name: "Jorj Oruell", biography: "Britaniyalik yozuvchi, 'Hayvonlar xo'jaligi' muallifi." },
  { id: "author-40", name: "Jyul Vern", biography: "Fransuz yozuvchisi, ilmiy-fantastik asarlar muallifi." },
  { id: "author-41", name: "Karim Rahimov", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-42", name: "Karlo Kollodi", biography: "Italiyalik yozuvchi, 'Pinokkio' asari muallifi." },
  { id: "author-43", name: "Kir Bulichev", biography: "Sovet ilmiy-fantastik yozuvchisi, 'Alisaning sayohatlari' muallifi." },
  { id: "author-44", name: "Latif Mahmudov", biography: "O'zbek bolalar yozuvchisi, ko'plab hikoya va qissalar muallifi." },
  { id: "author-45", name: "Lev Brandt", biography: "Sovet yozuvchisi, bolalar uchun hikoyalar yozgan." },
  { id: "author-46", name: "Lyuis Kerroll", biography: "Britaniyalik yozuvchi, 'Alisa mo'jizalar mamlakatida' muallifi." },
  { id: "author-47", name: "Maksim Gorkiy", biography: "Buyuk rus va sovet yozuvchisi." },
  { id: "author-48", name: "Mark Tven", biography: "Amerikalik yozuvchi, 'Tom Sawyer' asari muallifi." },
  { id: "author-49", name: "Mirali Mirakmalov", biography: "O'zbek bolalar shoiri." },
  { id: "author-50", name: "Miraziz A'zam", biography: "O'zbek bolalar yozuvchisi va shoiri." },
  { id: "author-51", name: "Mirkarim Osim", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-52", name: "Muazzam Ibrohimova", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-53", name: "Nazarmat", biography: "O'zbek bolalar shoiri." },
  { id: "author-54", name: "Nikolay Nosov", biography: "Sovet bolalar yozuvchisi, 'Bilmasvoy' asarlari muallifi." },
  { id: "author-55", name: "Nosir Fozilov", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-56", name: "Nozim Hikmat", biography: "Buyuk turk shoiri, bolalar uchun ertaklar yozgan." },
  { id: "author-57", name: "Nuri Bayramov", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-58", name: "Obid Rasul", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-59", name: "Pirimqul Qodirov", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-60", name: "Po'lat Mo'min", biography: "O'zbek bolalar yozuvchisi, ko'plab ertak va hikoyalar muallifi." },
  { id: "author-61", name: "Qambar Ota", biography: "O'zbek bolalar shoiri." },
  { id: "author-62", name: "Quddus Muhammadiy", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-63", name: "Rauf Tolib", biography: "O'zbek bolalar shoiri." },
  { id: "author-64", name: "Redyard Kipling", biography: "Britaniyalik yozuvchi, 'Maugli' asari muallifi." },
  { id: "author-65", name: "Rey Bredberi", biography: "Amerikalik ilmiy-fantastik yozuvchi." },
  { id: "author-66", name: "Rustam Nazar", biography: "O'zbek bolalar shoiri." },
  { id: "author-67", name: "Safar Barnoyev", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-68", name: "Samad Shoyqulov", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-69", name: "Sayyora Rahmonqulova", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-70", name: "Sergey Aksakov", biography: "Rus yozuvchisi, 'Olov gul' ertagi muallifi." },
  { id: "author-71", name: "Sergey Alekseyev", biography: "Sovet yozuvchisi, tarixiy hikoyalar yozgan." },
  { id: "author-72", name: "Sergey Rozanov", biography: "Sovet bolalar yozuvchisi." },
  { id: "author-73", name: "Shodi Sattor", biography: "O'zbek bolalar shoiri." },
  { id: "author-74", name: "Shukur Dadash", biography: "O'zbek bolalar yozuvchisi, ertaklar muallifi." },
  { id: "author-75", name: "Sobir Yunusov", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-76", name: "Sulton Jabbor", biography: "O'zbek bolalar shoiri." },
  { id: "author-77", name: "Temur Ubaydullo", biography: "O'zbek bolalar shoiri." },
  { id: "author-78", name: "To'lqin", biography: "O'zbek bolalar shoiri." },
  { id: "author-79", name: "Tursunboy Adashboyev", biography: "O'zbek bolalar shoiri." },
  { id: "author-80", name: "Umarali Qurbonov", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-81", name: "Umida Abduazimova", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-82", name: "Usmon Azim", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-83", name: "Valentin Luksha", biography: "Sovet bolalar shoiri." },
  { id: "author-84", name: "Vladimir Korolenko", biography: "Rus yozuvchisi, bolalar uchun hikoyalar yozgan." },
  { id: "author-85", name: "Vladimir Levshin", biography: "Sovet bolalar yozuvchisi." },
  { id: "author-86", name: "Vselovod Nestayko", biography: "Ukrainalik bolalar yozuvchisi." },
  { id: "author-87", name: "Xudoyberdi To'xtaboyev", biography: "O'zbek bolalar yozuvchisi, ko'plab romanlar muallifi." },
  { id: "author-88", name: "Yo'ldosh Sulaymon", biography: "O'zbek bolalar yozuvchisi." },
  { id: "author-89", name: "Yuriy Dmitriyev", biography: "Sovet bolalar yozuvchisi, tabiat haqida asarlar yozgan." },
  { id: "author-90", name: "Yuriy Kazakov", biography: "Sovet yozuvchisi, hikoyalar yozgan." },
  { id: "author-91", name: "Yuriy Yakovlev", biography: "Sovet bolalar yozuvchisi." },
  { id: "author-92", name: "Zulfiya", biography: "Buyuk o'zbek ayol shoiri, bolalar uchun she'rlar yozgan." },
  // Folk literature collectors/authors
  { id: "author-93", name: "Xalq og'zaki ijodi", biography: "O'zbek xalq og'zaki ijodi namunalari." },
  { id: "author-94", name: "Nasriddin Afandiy", biography: "Buyuk sharq humoristi, xalq latifalari qahramoni." },
  { id: "author-95", name: "Abu Muslim", biography: "Abu Muslim jangnomasi qahramoni." },
  { id: "author-96", name: "Afrosiyob", biography: "Alp Er To'nga yoki Afrosiyob jangnomasi qahramoni." },
  { id: "author-97", name: "O'zbek xalq ertaklari", biography: "O'zbek xalq ertaklari to'plami." },
  { id: "author-98", name: "Luqmoni Hakim", biography: "Qadimgi hikmat sohibi, xalq naqllari qahramoni." },
  { id: "author-99", name: "Mirzo Hamdam", biography: "Mirzo Hamdam qissasi qahramoni." },
  { id: "author-100", name: "Shoh Mashrab", biography: "Shoh Mashrab qissasi qahramoni, buyuk sufiy shoir." },
];

const CATEGORIES = [
  // Original categories
  { id: "cat-1", name: "Ommabop ilm-fan", slug: "ommabop-ilm-fan", description: "Ilmiy kitoblar oddiy tilda", icon: "🔬" },
  { id: "cat-2", name: "Badiiy adabiyot", slug: "badiiy-adabiyot", description: "Roman, hikoya, poemalar", icon: "📖" },
  { id: "cat-3", name: "O'zbek adabiyoti", slug: "ozbek-adabiyoti", description: "Milliy adabiyot namunalari", icon: "🇺🇿" },
  { id: "cat-4", name: "Fizika", slug: "fizika", description: "Fizika faniga oid kitoblar", icon: "⚛️" },
  { id: "cat-5", name: "Matematika", slug: "matematika", description: "Matematika faniga oid kitoblar", icon: "📐" },
  { id: "cat-6", name: "Ingliz tili", slug: "ingliz-tili", description: "Ingliz tili o'rganish kitoblari", icon: "🇬🇧" },
  { id: "cat-7", name: "Shaxsiy rivojlanish", slug: "shaxsiy-rivojlanish", description: "O'zini rivojlantirish kitoblari", icon: "🌱" },
  { id: "cat-8", name: "Tarix", slug: "tarix", description: "Tarixiy kitoblar", icon: "📜" },
  // ─── New children's book categories from ziyouz.com ───
  { id: "cat-9", name: "Bolalar kutubxonasi", slug: "bolalar-kutubxonasi", description: "Bolalar uchun maxsus tanlangan kitoblar", icon: "🧒" },
  { id: "cat-10", name: "Xalq ertaklari", slug: "xalq-ertaklari", description: "O'zbek xalq ertaklari va afsonalari", icon: "🧚" },
  { id: "cat-11", name: "Xalq dostonlari", slug: "xalq-dostonlari", description: "O'zbek xalq dostonlari va eposlari", icon: "⚔️" },
  { id: "cat-12", name: "Xalq og'zaki ijodi", slug: "xalq-ogzaki-ijodi", description: "O'zbek xalq og'zaki ijodi namunalari", icon: "🎭" },
  { id: "cat-13", name: "Jahon adabiyoti bolalar uchun", slug: "jahon-adabiyoti-bolalar", description: "Jahon yozuvchilarining bolalar uchun asarlari", icon: "🌍" },
  { id: "cat-14", name: "Bolalar she'rlari", slug: "bolalar-sherlari", description: "Bolalar uchun she'rlar to'plami", icon: "🌸" },
  { id: "cat-15", name: "Bolalar hikoyalari", slug: "bolalar-hikoyalari", description: "Bolalar uchun hikoya va qissalar", icon: "📚" },
  { id: "cat-16", name: "Bolalar ensiklopediyasi", slug: "bolalar-ensiklopediyasi", description: "Bolalar uchun bilim beruvchi kitoblar", icon: "🧩" },
];

const BOOKS = [
  // ─── Original books ──────────────────────────────────────
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
  {
    id: "book-21", title: "8-sinf O'zbekiston tarixi", description: "O'zbekiston Respublikasi maktablari uchun 8-sinf tarix darsligi. 2019-yil nashri.",
    coverUrl: "/covers/ozbek-tarixi.svg", pdfUrl: "pdfs/book-21.pdf", language: "UZ", totalPages: 160, authorId: "author-10", categoryId: "cat-8", isPublished: true,
  },
  {
    id: "book-22", title: "9-sinf O'zbekiston tarixi", description: "O'zbekiston Respublikasi maktablari uchun 9-sinf tarix darsligi. 2019-yil nashri.",
    coverUrl: "/covers/ozbek-tarixi.svg", pdfUrl: "pdfs/book-22.pdf", language: "UZ", totalPages: 120, authorId: "author-10", categoryId: "cat-8", isPublished: true,
  },
  {
    id: "book-23", title: "8-sinf Jahon tarixi", description: "O'zbekiston Respublikasi maktablari uchun 8-sinf jahon tarixi darsligi. 2019-yil nashri.",
    coverUrl: "/covers/ozbek-tarixi.svg", pdfUrl: "pdfs/book-23.pdf", language: "UZ", totalPages: 160, authorId: "author-10", categoryId: "cat-8", isPublished: true,
  },
  {
    id: "book-24", title: "5-sinf Tarixdan hikoyalar", description: "Maktabgacha va boshlang'ich ta'lim uchun tarixdan hikoyalar.",
    coverUrl: "/covers/ozbek-tarixi.svg", pdfUrl: "pdfs/book-24.pdf", language: "UZ", totalPages: 90, authorId: "author-10", categoryId: "cat-8", isPublished: true,
  },

  // ─── 250 CHILDREN'S BOOKS FROM ZIYOUZ.COM ──────────────────
  // ─── Category: Bolalar kutubxonasi (cat-9) ───

  { id: "book-25", title: "G'aroyib avtobus", description: "Abdurahmon Akbarning bolalar uchun yozgan g'oyib hikoyasi. Kichkintoy avtobus bilan g'oyib sayohatga chiqadi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-25.pdf", language: "UZ", totalPages: 48, authorId: "author-11", categoryId: "cat-9", isPublished: true },
  { id: "book-26", title: "Jonimning suratlari", description: "Abdurahmon Akbarning bolalar uchun asari. Bolalarning ichki olami haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-26.pdf", language: "UZ", totalPages: 56, authorId: "author-11", categoryId: "cat-9", isPublished: true },
  { id: "book-27", title: "Uyquchining tushlari", description: "Abdurahmon Akbarning bolalar uchun ertak hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-27.pdf", language: "UZ", totalPages: 42, authorId: "author-11", categoryId: "cat-9", isPublished: true },
  { id: "book-28", title: "Kichkintoy va Paxtaoy", description: "Abdurahmon Akbarovning bolalar uchun hikoyasi. Kichkintoyning paxta bilan sarguzashtlari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-28.pdf", language: "UZ", totalPages: 36, authorId: "author-11", categoryId: "cat-9", isPublished: true },
  { id: "book-29", title: "Ertaklar", description: "Aleksandr Pushkinning mashhur ertaklari. Qor malikasi, Barmoq qiz, Tsar Saltan hikoyasi va boshqalar.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-29.pdf", language: "UZ", totalPages: 120, authorId: "author-12", categoryId: "cat-10", isPublished: true },
  { id: "book-30", title: "Ertaklar (1949)", description: "Aleksandr Pushkinning 1949-yil nashridagi ertaklari to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-30.pdf", language: "UZ", totalPages: 115, authorId: "author-12", categoryId: "cat-10", isPublished: true },
  { id: "book-31", title: "Hikmatlar (bolalar uchun)", description: "Alisher Navoiyning bolalar uchun moslashtirilgan hikmatlari va dono so'zlari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-31.pdf", language: "UZ", totalPages: 80, authorId: "author-13", categoryId: "cat-9", isPublished: true },
  { id: "book-32", title: "Shiroq", description: "Alisher Sa'dullaning bolalar uchun hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-32.pdf", language: "UZ", totalPages: 44, authorId: "author-14", categoryId: "cat-9", isPublished: true },
  { id: "book-33", title: "Amir Temur haqida hikoyalar", description: "Buyuk sarkarda Amir Temur haqida bolalar uchun yozilgan hikoyalar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-33.pdf", language: "UZ", totalPages: 96, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-34", title: "Akam klarnet chaladi", description: "Anatoliy Aleksinning bolalar uchun qissalari to'plami. Oila va do'stlik haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-34.pdf", language: "UZ", totalPages: 108, authorId: "author-15", categoryId: "cat-13", isPublished: true },
  { id: "book-35", title: "Krosh va uning o'rtoqlari", description: "Anatoliy Ribakovning bolalar uchun qissasi. Maktab hayoti va do'stlik haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-35.pdf", language: "UZ", totalPages: 144, authorId: "author-16", categoryId: "cat-13", isPublished: true },
  { id: "book-36", title: "Kichkina shahzoda", description: "Antuan de Sent-Ekzyuperining dunyodagi eng mashhur bolalar qissasi. Do'stlik, sevgi va hayot haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-36.pdf", language: "UZ", totalPages: 96, authorId: "author-17", categoryId: "cat-13", isPublished: true },
  { id: "book-37", title: "Alamazon va Gulmat hangomasi", description: "Anvar Obidjonning bolalar uchun hangomasi. Kulgili voqealar haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-37.pdf", language: "UZ", totalPages: 32, authorId: "author-18", categoryId: "cat-9", isPublished: true },
  { id: "book-38", title: "Bahromning hikoyalari", description: "Anvar Obidjonning bolalar uchun hikoyalar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-38.pdf", language: "UZ", totalPages: 64, authorId: "author-18", categoryId: "cat-15", isPublished: true },
  { id: "book-39", title: "Ey yorug' dunyo", description: "Anvar Obidjonning bolalar uchun qissasi. Dunyoni kashf etish haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-39.pdf", language: "UZ", totalPages: 88, authorId: "author-18", categoryId: "cat-15", isPublished: true },
  { id: "book-40", title: "Hajviy hikoyalar", description: "Anvar Obidjonning bolalar uchun hajviy hikoyalar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-40.pdf", language: "UZ", totalPages: 56, authorId: "author-18", categoryId: "cat-9", isPublished: true },
  { id: "book-41", title: "Juda qiziq voqea", description: "Anvar Obidjonning bolalar uchun qiziq voqea haqida hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-41.pdf", language: "UZ", totalPages: 40, authorId: "author-18", categoryId: "cat-9", isPublished: true },
  { id: "book-42", title: "Kezargon Boychechak", description: "Anvar Obidjonning bolalar uchun qissasi. Sayohat va sarguzasht haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-42.pdf", language: "UZ", totalPages: 72, authorId: "author-18", categoryId: "cat-15", isPublished: true },
  { id: "book-43", title: "Masxaraboz bola", description: "Anvar Obidjonning bolalar uchun hikoyasi. Masxaraboz bola haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-43.pdf", language: "UZ", totalPages: 36, authorId: "author-18", categoryId: "cat-9", isPublished: true },
  { id: "book-44", title: "Meshpolvonning janglari", description: "Anvar Obidjonning bolalar uchun jangari hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-44.pdf", language: "UZ", totalPages: 48, authorId: "author-18", categoryId: "cat-9", isPublished: true },
  { id: "book-45", title: "Mushuk bibi miyovladi", description: "Anvar Obidjonning bolalar uchun kulgili hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-45.pdf", language: "UZ", totalPages: 28, authorId: "author-18", categoryId: "cat-9", isPublished: true },
  { id: "book-46", title: "O'g'irlangan pahlavon", description: "Anvar Obidjonning bolalar uchun sarguzasht hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-46.pdf", language: "UZ", totalPages: 52, authorId: "author-18", categoryId: "cat-9", isPublished: true },
  { id: "book-47", title: "Oltin yurakli avtobola", description: "Anvar Obidjonning bolalar uchun qissasi. Oltin yurakli avtobola haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-47.pdf", language: "UZ", totalPages: 68, authorId: "author-18", categoryId: "cat-15", isPublished: true },
  { id: "book-48", title: "Ona Yer", description: "Anvar Obidjonning bolalar uchun tabiat haqida hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-48.pdf", language: "UZ", totalPages: 44, authorId: "author-18", categoryId: "cat-9", isPublished: true },
  { id: "book-49", title: "Qorinbotir", description: "Anvar Obidjonning bolalar uchun dostoni. Kulgili qahramon haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-49.pdf", language: "UZ", totalPages: 36, authorId: "author-18", categoryId: "cat-9", isPublished: true },
  { id: "book-50", title: "Mittivoy va Karlson", description: "Astrid Lindgrenning dunyodagi eng mashhur bolalar qissasi. Mittivoyning Karlson bilan sarguzashtlari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-50.pdf", language: "UZ", totalPages: 160, authorId: "author-19", categoryId: "cat-13", isPublished: true },
  { id: "book-51", title: "G'aroyib bolalar", description: "Aziz Nesinning bolalar uchun romani. Bolalarning g'oyib sarguzashtlari haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-51.pdf", language: "UZ", totalPages: 224, authorId: "author-20", categoryId: "cat-13", isPublished: true },
  { id: "book-52", title: "Hayvonlar haqida hikoyalar", description: "Aziz Nesinning bolalar uchun hayvonlar haqida hikoyalar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-52.pdf", language: "UZ", totalPages: 96, authorId: "author-20", categoryId: "cat-13", isPublished: true },
  { id: "book-53", title: "So'rasam maylimi, oyi", description: "Bibisora Otayevasning bolalar uchun she'rlar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-53.pdf", language: "UZ", totalPages: 48, authorId: "author-21", categoryId: "cat-14", isPublished: true },
  { id: "book-54", title: "Cho'pchagim cho'pchak", description: "Boris Pakning bolalar uchun kulgili she'rlar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-54.pdf", language: "UZ", totalPages: 32, authorId: "author-22", categoryId: "cat-14", isPublished: true },
  { id: "book-55", title: "Ko'r muzikachi", description: "Ko'r muzikachi haqida bolalar uchun hikoya. Musiqa va san'at sevgisi haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-55.pdf", language: "UZ", totalPages: 64, authorId: "author-84", categoryId: "cat-15", isPublished: true },
  { id: "book-56", title: "Dunyo bolalari", description: "Turli mamlakatlar bolalari haqida hikoyalar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-56.pdf", language: "UZ", totalPages: 128, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-57", title: "Buvijonim keldilar", description: "E'tibor Oxunovaning bolalar uchun hikoyasi. Buvisining kelishi haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-57.pdf", language: "UZ", totalPages: 40, authorId: "author-93", categoryId: "cat-9", isPublished: true },
  { id: "book-58", title: "Anton bo'rini uchratgan kecha", description: "Edith Shrayber Vikening bolalar uchun qissasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-58.pdf", language: "UZ", totalPages: 88, authorId: "author-23", categoryId: "cat-13", isPublished: true },
  { id: "book-59", title: "Izquvar Brok", description: "Eduard Vovrushkaning bolalar uchun ertagi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-59.pdf", language: "UZ", totalPages: 48, authorId: "author-24", categoryId: "cat-10", isPublished: true },
  { id: "book-60", title: "Gullarim - bulbullarim", description: "Ergash Raimovning bolalar uchun she'rlar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-60.pdf", language: "UZ", totalPages: 56, authorId: "author-25", categoryId: "cat-14", isPublished: true },
  { id: "book-61", title: "Champo otli ilon", description: "Erkin Malikning bolalar uchun ertak hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-61.pdf", language: "UZ", totalPages: 36, authorId: "author-26", categoryId: "cat-10", isPublished: true },
  { id: "book-62", title: "Tush kinoga o'xshaydi", description: "Erkin Usmonovning bolalar uchun hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-62.pdf", language: "UZ", totalPages: 44, authorId: "author-93", categoryId: "cat-9", isPublished: true },
  { id: "book-63", title: "Mening yulduzim", description: "Erkin Vohidovning bolalar uchun she'rlari. Yulduzlar va orzular haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-63.pdf", language: "UZ", totalPages: 64, authorId: "author-27", categoryId: "cat-14", isPublished: true },
  { id: "book-64", title: "Bir qultum buloq suvi", description: "Farhod Musajonovning bolalar uchun qissasi. Tabiat va inson haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-64.pdf", language: "UZ", totalPages: 72, authorId: "author-28", categoryId: "cat-15", isPublished: true },
  { id: "book-65", title: "Bosh kelma, Aliqulov", description: "Farhod Musajonovning bolalar uchun qissasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-65.pdf", language: "UZ", totalPages: 56, authorId: "author-28", categoryId: "cat-15", isPublished: true },
  { id: "book-66", title: "Orzuga ayb yo'q", description: "Farhod Musajonovning bolalar uchun qissasi. Orzular va umidlar haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-66.pdf", language: "UZ", totalPages: 80, authorId: "author-28", categoryId: "cat-15", isPublished: true },
  { id: "book-67", title: "Qissalar", description: "Farhod Musajonovning bolalar uchun qissalar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-67.pdf", language: "UZ", totalPages: 128, authorId: "author-28", categoryId: "cat-15", isPublished: true },
  { id: "book-68", title: "Quyosh rasmi", description: "Farid Usmonning bolalar uchun she'rlar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-68.pdf", language: "UZ", totalPages: 40, authorId: "author-29", categoryId: "cat-14", isPublished: true },
  { id: "book-69", title: "Cho'ldan topilgan bola", description: "Frensis Bret-Gartning bolalar uchun qissasi. Cho'lda topilgan bola haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-69.pdf", language: "UZ", totalPages: 112, authorId: "author-30", categoryId: "cat-13", isPublished: true },
  { id: "book-70", title: "Farzandlarimga", description: "G'afur G'ulomning bolalari uchun she'rlari. Ona va bola sevgisi haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-70.pdf", language: "UZ", totalPages: 48, authorId: "author-31", categoryId: "cat-14", isPublished: true },
  { id: "book-71", title: "Oltin bola", description: "Gans Xristian Andersenning ertaklari. Oltin bola haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-71.pdf", language: "UZ", totalPages: 96, authorId: "author-32", categoryId: "cat-10", isPublished: true },
  { id: "book-72", title: "Qor odam", description: "Gans Xristian Andersenning 'Qor odam' ertagi. Qish haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-72.pdf", language: "UZ", totalPages: 32, authorId: "author-32", categoryId: "cat-10", isPublished: true },
  { id: "book-73", title: "Oygul bilan Baxtiyor", description: "Hamid Olimjonning bolalar uchun dostoni. Sevgi va sadoqat haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-73.pdf", language: "UZ", totalPages: 80, authorId: "author-33", categoryId: "cat-11", isPublished: true },
  { id: "book-74", title: "Oygul bilan Baxtiyor (dostonlar)", description: "Hamid Olimjonning bolalar uchun dostonlar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-74.pdf", language: "UZ", totalPages: 96, authorId: "author-33", categoryId: "cat-11", isPublished: true },
  { id: "book-75", title: "Oygul va Baxtiyor", description: "Hamid Olimjonning 1954-yil nashridagi bolalar uchun dostoni.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-75.pdf", language: "UZ", totalPages: 72, authorId: "author-33", categoryId: "cat-11", isPublished: true },
  { id: "book-76", title: "Semurg'. Oygul va Baxtiyor", description: "Hamid Olimjonning 1946-yil nashridagi bolalar uchun dostonlari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-76.pdf", language: "UZ", totalPages: 88, authorId: "author-33", categoryId: "cat-11", isPublished: true },
  { id: "book-77", title: "Mumu", description: "Ivan Turgenevning bolalar uchun hikoyasi. It va odam do'stligi haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-77.pdf", language: "UZ", totalPages: 48, authorId: "author-34", categoryId: "cat-13", isPublished: true },
  { id: "book-78", title: "Jelsomino yolg'onchilar mamlakatida", description: "Janni Rodarining bolalar uchun qissasi. Jelsomino sayohati haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-78.pdf", language: "UZ", totalPages: 128, authorId: "author-35", categoryId: "cat-13", isPublished: true },
  { id: "book-79", title: "Rim ertaklari", description: "Janni Rodarining Rim haqida bolalar uchun ertaklari to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-79.pdf", language: "UZ", totalPages: 96, authorId: "author-35", categoryId: "cat-13", isPublished: true },
  { id: "book-80", title: "Kish haqida qissa", description: "Jek Londonning bolalar uchun hikoyalar to'plami. Hayot va kurash haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-80.pdf", language: "UZ", totalPages: 112, authorId: "author-36", categoryId: "cat-13", isPublished: true },
  { id: "book-81", title: "Amu to'lqini", description: "Jo'ldasboy Dilmuratovning bolalar uchun hikoyasi. Amudaryo haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-81.pdf", language: "UZ", totalPages: 64, authorId: "author-37", categoryId: "cat-9", isPublished: true },
  { id: "book-82", title: "Gulliverning sayohatlari", description: "Jonatan Sviftning bolalar uchun romani. Gulliverning g'ayrioddiy sayohatlari haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-82.pdf", language: "UZ", totalPages: 192, authorId: "author-38", categoryId: "cat-13", isPublished: true },
  { id: "book-83", title: "Hayvonlar xo'jaligi", description: "Jorj Oruellning bolalar uchun g'aroyib qissasi. Hayvonlar hayoti haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-83.pdf", language: "UZ", totalPages: 144, authorId: "author-39", categoryId: "cat-13", isPublished: true },
  { id: "book-84", title: "O'n besh yoshli kapitan", description: "Jyul Vernning bolalar uchun romani. Dengiz sayohati haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-84.pdf", language: "UZ", totalPages: 176, authorId: "author-40", categoryId: "cat-13", isPublished: true },
  { id: "book-85", title: "Dilbar", description: "Karim Rahimovning bolalar uchun hikoyasi (1957).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-85.pdf", language: "UZ", totalPages: 56, authorId: "author-41", categoryId: "cat-9", isPublished: true },
  { id: "book-86", title: "Pinokkioning boshidan kechirganlari", description: "Karlo Kollodining dunyodagi eng mashhur bolalar qissasi. Pinokkio haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-86.pdf", language: "UZ", totalPages: 160, authorId: "author-42", categoryId: "cat-13", isPublished: true },
  { id: "book-87", title: "Alisaning sayohatlari", description: "Kir Bulichevning bolalar uchun ilmiy-fantastik qissasi. Alisaning kosmik sayohatlari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-87.pdf", language: "UZ", totalPages: 192, authorId: "author-43", categoryId: "cat-13", isPublished: true },
  { id: "book-88", title: "Bolalar shodligi", description: "Latif Mahmudovning bolalar uchun she'rlar to'plami (1968).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-88.pdf", language: "UZ", totalPages: 48, authorId: "author-44", categoryId: "cat-14", isPublished: true },
  { id: "book-89", title: "Burgut olib qochgan bola", description: "Latif Mahmudovning bolalar uchun hikoyasi (1985).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-89.pdf", language: "UZ", totalPages: 56, authorId: "author-44", categoryId: "cat-9", isPublished: true },
  { id: "book-90", title: "Chinor", description: "Latif Mahmudovning bolalar uchun hikoyasi (1961). Chinor daraxti haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-90.pdf", language: "UZ", totalPages: 44, authorId: "author-44", categoryId: "cat-9", isPublished: true },
  { id: "book-91", title: "Dangasaning holi voy", description: "Latif Mahmudovning bolalar uchun ertak hikoyasi (1989).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-91.pdf", language: "UZ", totalPages: 36, authorId: "author-44", categoryId: "cat-10", isPublished: true },
  { id: "book-92", title: "Ikki do'st", description: "Latif Mahmudovning bolalar uchun do'stlik haqida hikoyasi (1963).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-92.pdf", language: "UZ", totalPages: 48, authorId: "author-44", categoryId: "cat-9", isPublished: true },
  { id: "book-93", title: "Jasur bolalar", description: "Latif Mahmudovning bolalar uchun jasurlar haqida hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-93.pdf", language: "UZ", totalPages: 64, authorId: "author-44", categoryId: "cat-9", isPublished: true },
  { id: "book-94", title: "Qopga yashiringan odam", description: "Latif Mahmudovning bolalar uchun hikoyasi (1976).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-94.pdf", language: "UZ", totalPages: 40, authorId: "author-44", categoryId: "cat-9", isPublished: true },
  { id: "book-95", title: "Sho'x daryoning siri", description: "Latif Mahmudovning bolalar uchun ertak hikoyasi (1966).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-95.pdf", language: "UZ", totalPages: 52, authorId: "author-44", categoryId: "cat-10", isPublished: true },
  { id: "book-96", title: "Sirli xat", description: "Latif Mahmudovning bolalar uchun sirlar haqida hikoyasi (1981).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-96.pdf", language: "UZ", totalPages: 48, authorId: "author-44", categoryId: "cat-9", isPublished: true },
  { id: "book-97", title: "Oq kaptar", description: "Lev Brandtning bolalar uchun qissa va hikoyalari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-97.pdf", language: "UZ", totalPages: 80, authorId: "author-45", categoryId: "cat-13", isPublished: true },
  { id: "book-98", title: "Alisa mo'jizalar mamlakatida", description: "Lyuis Kerrollning dunyodagi eng mashhur bolalar ertagi. Alisaning mo'jizalar dunyosiga sayohati.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-98.pdf", language: "UZ", totalPages: 128, authorId: "author-46", categoryId: "cat-13", isPublished: true },
  { id: "book-99", title: "Bolalik", description: "Maksim Gorkiyning bolalar uchun qissasi. Bolalik haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-99.pdf", language: "UZ", totalPages: 160, authorId: "author-47", categoryId: "cat-13", isPublished: true },
  { id: "book-100", title: "Tom Soyerning yangi sarguzashtlari", description: "Mark Tvenning bolalar uchun qissasi. Tom Sawyerning yangi sarguzashtlari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-100.pdf", language: "UZ", totalPages: 192, authorId: "author-48", categoryId: "cat-13", isPublished: true },

  { id: "book-101", title: "Yulduzlar. Quyosh. Oy", description: "Mirali Mirakmalovning bolalar uchun she'rlar to'plami. Kosmos haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-101.pdf", language: "UZ", totalPages: 40, authorId: "author-49", categoryId: "cat-14", isPublished: true },
  { id: "book-102", title: "Eng yorug' yulduzlar", description: "Miraziz A'zamning bolalar uchun she'rlar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-102.pdf", language: "UZ", totalPages: 56, authorId: "author-50", categoryId: "cat-14", isPublished: true },
  { id: "book-103", title: "Qirq bolaga qirq savol", description: "Miraziz A'zamning bolalar uchun savol-javob kitobi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-103.pdf", language: "UZ", totalPages: 72, authorId: "author-50", categoryId: "cat-16", isPublished: true },
  { id: "book-104", title: "Saylanma (Bolalar uchun asarlar)", description: "Miraziz A'zamning bolalar uchun saylanma asarlari to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-104.pdf", language: "UZ", totalPages: 144, authorId: "author-50", categoryId: "cat-9", isPublished: true },
  { id: "book-105", title: "Senga nima bo'ldi", description: "Miraziz A'zamning bolalar uchun hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-105.pdf", language: "UZ", totalPages: 48, authorId: "author-50", categoryId: "cat-9", isPublished: true },
  { id: "book-106", title: "Aljabrning tug'ilishi", description: "Mirkarim Osimning bolalar uchun ilmiy hikoyasi. Matematika tarixi haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-106.pdf", language: "UZ", totalPages: 80, authorId: "author-51", categoryId: "cat-16", isPublished: true },
  { id: "book-107", title: "Ibn Sino qissasi", description: "Mirkarim Osimning buyuk olim Ibn Sino haqida bolalar uchun yozgan qissasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-107.pdf", language: "UZ", totalPages: 96, authorId: "author-51", categoryId: "cat-9", isPublished: true },
  { id: "book-108", title: "Yangi Zilopiyadagi sarguzashtlar", description: "Muazzam Ibrohimovaning bolalar uchun fantastik sarguzasht qissasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-108.pdf", language: "UZ", totalPages: 112, authorId: "author-52", categoryId: "cat-9", isPublished: true },
  { id: "book-109", title: "G'unchalar", description: "Nazarmatning bolalar uchun she'rlar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-109.pdf", language: "UZ", totalPages: 36, authorId: "author-53", categoryId: "cat-14", isPublished: true },
  { id: "book-110", title: "Bilmasvoy bilan do'stlarining boshidan kechirganlari", description: "Nikolay Nosovning bolalar uchun kulgili hikoyalar to'plami. Bilmasvoy haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-110.pdf", language: "UZ", totalPages: 128, authorId: "author-54", categoryId: "cat-13", isPublished: true },
  { id: "book-111", title: "Bilmasvoy Quyosh shahrida", description: "Nikolay Nosovning Bolmasvoyning Quyosh shahriga sayohati haqida romani.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-111.pdf", language: "UZ", totalPages: 160, authorId: "author-54", categoryId: "cat-13", isPublished: true },
  { id: "book-112", title: "Bilmasvoy va do'stlarining boshdan kechirganlari", description: "Nikolay Nosovning Bolmasvoy haqida yana bir romani.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-112.pdf", language: "UZ", totalPages: 144, authorId: "author-54", categoryId: "cat-13", isPublished: true },
  { id: "book-113", title: "Bolaligim - poshsholigim", description: "Nosir Fozilovning bolalar uchun xotiralar kitobi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-113.pdf", language: "UZ", totalPages: 88, authorId: "author-55", categoryId: "cat-9", isPublished: true },
  { id: "book-114", title: "Saraton", description: "Nosir Fozilovning bolalar uchun qissalar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-114.pdf", language: "UZ", totalPages: 96, authorId: "author-55", categoryId: "cat-15", isPublished: true },
  { id: "book-115", title: "Shum bolaning nabiralari", description: "Nosir Fozilovning bolalar uchun hikoyasi (1985).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-115.pdf", language: "UZ", totalPages: 64, authorId: "author-55", categoryId: "cat-9", isPublished: true },
  { id: "book-116", title: "Oshiq bulut", description: "Nozim Hikmatning bolalar uchun ertaklari to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-116.pdf", language: "UZ", totalPages: 72, authorId: "author-56", categoryId: "cat-10", isPublished: true },
  { id: "book-117", title: "Yetti botir", description: "Nuri Bayramovning bolalar uchun epik hikoyasi. Yetti botir haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-117.pdf", language: "UZ", totalPages: 96, authorId: "author-57", categoryId: "cat-11", isPublished: true },
  { id: "book-118", title: "Xayrixon va Maylixon", description: "Obid Rasulning bolalar uchun hikoyasi. Do'stlik va sadoqat haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-118.pdf", language: "UZ", totalPages: 56, authorId: "author-58", categoryId: "cat-9", isPublished: true },
  { id: "book-119", title: "Akramning sarguzashtlari", description: "Pirimqul Qodirovning bolalar uchun sarguzasht hikoyasi (1988).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-119.pdf", language: "UZ", totalPages: 112, authorId: "author-59", categoryId: "cat-9", isPublished: true },
  { id: "book-120", title: "Ahil bo'lib, dadil bo'lib", description: "Po'lat Mo'minning bolalar uchun hikoyasi. Ahillik va jasurlig haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-120.pdf", language: "UZ", totalPages: 48, authorId: "author-60", categoryId: "cat-9", isPublished: true },

  { id: "book-121", title: "Bolajon-bolajonim", description: "Po'lat Mo'minning bolalar uchun she'rlar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-121.pdf", language: "UZ", totalPages: 40, authorId: "author-60", categoryId: "cat-14", isPublished: true },
  { id: "book-122", title: "Bu - juda soz", description: "Po'lat Mo'minning bolalar uchun hikoyasi (1978).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-122.pdf", language: "UZ", totalPages: 44, authorId: "author-60", categoryId: "cat-9", isPublished: true },
  { id: "book-123", title: "Ibn Sino ulashar davo", description: "Po'lat Mo'minning Ibn Sino haqida bolalar uchun hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-123.pdf", language: "UZ", totalPages: 56, authorId: "author-60", categoryId: "cat-9", isPublished: true },
  { id: "book-124", title: "Odob va Oftob", description: "Po'lat Mo'minning bolalar uchun axloqiy hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-124.pdf", language: "UZ", totalPages: 36, authorId: "author-60", categoryId: "cat-9", isPublished: true },
  { id: "book-125", title: "Oltmish olti oltin qo'l", description: "Po'lat Mo'minning bolalar uchun ertak hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-125.pdf", language: "UZ", totalPages: 52, authorId: "author-60", categoryId: "cat-10", isPublished: true },
  { id: "book-126", title: "Quyosh bola oy bola", description: "Qambar Otaning bolalar uchun she'rlar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-126.pdf", language: "UZ", totalPages: 36, authorId: "author-61", categoryId: "cat-14", isPublished: true },
  { id: "book-127", title: "Toshpolvon va Ishpolvon haqida ertak", description: "Qambar Otaning bolalar uchun ertagi. Ikki botir haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-127.pdf", language: "UZ", totalPages: 48, authorId: "author-61", categoryId: "cat-10", isPublished: true },
  { id: "book-128", title: "Men sizga bir hikmat aytayin", description: "Quddus Muhammadiyning bolalar uchun hikmatlar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-128.pdf", language: "UZ", totalPages: 64, authorId: "author-62", categoryId: "cat-9", isPublished: true },
  { id: "book-129", title: "Odam - olam qo'shig'i", description: "Quddus Muhammadiyning bolalar uchun she'rlari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-129.pdf", language: "UZ", totalPages: 48, authorId: "author-62", categoryId: "cat-14", isPublished: true },
  { id: "book-130", title: "Qanotli do'stlar. Tabiat alifbesi. 3-kitob", description: "Quddus Muhammadiyning bolalar uchun tabiat haqida kitobi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-130.pdf", language: "UZ", totalPages: 72, authorId: "author-62", categoryId: "cat-16", isPublished: true },
  { id: "book-131", title: "Eshitmadim demanglar", description: "Rauf Tolibning bolalar uchun she'rlar va ertaklar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-131.pdf", language: "UZ", totalPages: 56, authorId: "author-63", categoryId: "cat-14", isPublished: true },
  { id: "book-132", title: "Ona yurt", description: "Rauf Tolibning bolalar uchun vatan haqida she'rlari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-132.pdf", language: "UZ", totalPages: 44, authorId: "author-63", categoryId: "cat-14", isPublished: true },
  { id: "book-133", title: "Maugli", description: "Redyard Kiplingning dunyodagi eng mashhur bolalar qissasi. Maugli - o'rmondagi bola haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-133.pdf", language: "UZ", totalPages: 192, authorId: "author-64", categoryId: "cat-13", isPublished: true },
  { id: "book-134", title: "Momaqaymoq", description: "Rey Bredberining bolalar uchun qissasi. Momaqaymoq haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-134.pdf", language: "UZ", totalPages: 80, authorId: "author-65", categoryId: "cat-13", isPublished: true },
  { id: "book-135", title: "Yashasin quyoshli kun", description: "Rustam Nazarning bolalar uchun she'rlar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-135.pdf", language: "UZ", totalPages: 40, authorId: "author-66", categoryId: "cat-14", isPublished: true },
  { id: "book-136", title: "Tinchlikni ulug'laymiz", description: "Safar Barnoyevning bolalar uchun tinchlik haqida she'rlari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-136.pdf", language: "UZ", totalPages: 36, authorId: "author-67", categoryId: "cat-14", isPublished: true },
  { id: "book-137", title: "Mo'jizakor moshinlar", description: "Samad Shoyqulovning bolalar uchun texnika haqida hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-137.pdf", language: "UZ", totalPages: 56, authorId: "author-68", categoryId: "cat-16", isPublished: true },
  { id: "book-138", title: "Kompyuter olamiga sayohat", description: "Sayyora Rahmonqulovaning bolalar uchun kompyuter haqida kitobi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-138.pdf", language: "UZ", totalPages: 64, authorId: "author-69", categoryId: "cat-16", isPublished: true },
  { id: "book-139", title: "Olov gul", description: "Sergey Aksakovning bolalar uchun ertagi. Olov gul haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-139.pdf", language: "UZ", totalPages: 72, authorId: "author-70", categoryId: "cat-10", isPublished: true },
  { id: "book-140", title: "Suvorov haqida hikoyalar", description: "Sergey Alekseyevning buyuk sarkarda Suvorov haqida bolalar uchun hikoyalari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-140.pdf", language: "UZ", totalPages: 96, authorId: "author-71", categoryId: "cat-15", isPublished: true },
  { id: "book-141", title: "Maysajonning sarguzashtlari", description: "Sergey Rozanovning bolalar uchun qissasi. Maysajonning sarguzashtlari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-141.pdf", language: "UZ", totalPages: 88, authorId: "author-72", categoryId: "cat-13", isPublished: true },
  { id: "book-142", title: "Buncha totli", description: "Shodi Sattorning bolalar uchun she'rlar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-142.pdf", language: "UZ", totalPages: 36, authorId: "author-73", categoryId: "cat-14", isPublished: true },
  { id: "book-143", title: "Buvimning ertaklari", description: "Shukur Dadashning bolalar uchun ertaklar to'plami (1978).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-143.pdf", language: "UZ", totalPages: 96, authorId: "author-74", categoryId: "cat-10", isPublished: true },
  { id: "book-144", title: "Hofiz bola", description: "Sobir Yunusovning bolalar uchun qissalar to'plami. Hofiz bola haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-144.pdf", language: "UZ", totalPages: 80, authorId: "author-75", categoryId: "cat-15", isPublished: true },
  { id: "book-145", title: "Quyosh qoldi dalada", description: "Sulton Jabborning bolalar uchun she'rlar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-145.pdf", language: "UZ", totalPages: 40, authorId: "author-76", categoryId: "cat-14", isPublished: true },
  { id: "book-146", title: "Sevinib yashayman", description: "Sulton Jabborning bolalar uchun ijobiy ruhdagi she'rlari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-146.pdf", language: "UZ", totalPages: 36, authorId: "author-76", categoryId: "cat-14", isPublished: true },
  { id: "book-147", title: "Qirlar to'la qizg'aldoq", description: "Temur Ubaydolloning bolalar uchun tabiat haqida she'rlari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-147.pdf", language: "UZ", totalPages: 44, authorId: "author-77", categoryId: "cat-14", isPublished: true },
  { id: "book-148", title: "G'unchalar", description: "To'lqinning bolalar uchun she'rlar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-148.pdf", language: "UZ", totalPages: 32, authorId: "author-78", categoryId: "cat-14", isPublished: true },
  { id: "book-149", title: "Oqbura to'lqinlari", description: "Tursunboy Adashboyevning bolalar uchun she'rlari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-149.pdf", language: "UZ", totalPages: 48, authorId: "author-79", categoryId: "cat-14", isPublished: true },
  { id: "book-150", title: "Orzularim - qo'sh qanotim", description: "Tursunboy Adashboyevning bolalar uchun orzular haqida she'rlari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-150.pdf", language: "UZ", totalPages: 40, authorId: "author-79", categoryId: "cat-14", isPublished: true },

  { id: "book-151", title: "Uch baqaloq", description: "Uch baqaloq haqida bolalar uchun ertak (1988).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-151.pdf", language: "UZ", totalPages: 36, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-152", title: "Dilbar va gullar", description: "Umarali Qurbonovning bolalar uchun hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-152.pdf", language: "UZ", totalPages: 44, authorId: "author-80", categoryId: "cat-9", isPublished: true },
  { id: "book-153", title: "Yozilmagan kitob", description: "Umida Abduazimovaning bolalar uchun qissasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-153.pdf", language: "UZ", totalPages: 72, authorId: "author-81", categoryId: "cat-9", isPublished: true },
  { id: "book-154", title: "G'aroyib ajdarho", description: "Usmon Azimning bolalar uchun ertak hikoyasi. Ajdarho haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-154.pdf", language: "UZ", totalPages: 56, authorId: "author-82", categoryId: "cat-10", isPublished: true },
  { id: "book-155", title: "Yil bo'yi yoz", description: "Valentin Lukshaning bolalar uchun she'rlari va ertaklari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-155.pdf", language: "UZ", totalPages: 64, authorId: "author-83", categoryId: "cat-14", isPublished: true },
  { id: "book-156", title: "Xo'rlangan bolalar", description: "Vladimir Korolenkoning bolalar uchun qissasi. Haqiqat va adolat haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-156.pdf", language: "UZ", totalPages: 88, authorId: "author-84", categoryId: "cat-13", isPublished: true },
  { id: "book-157", title: "Dengizchi Noljon", description: "Vladimir Levshinning bolalar uchun dengizchi haqida hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-157.pdf", language: "UZ", totalPages: 72, authorId: "author-85", categoryId: "cat-9", isPublished: true },
  { id: "book-158", title: "Robinzon Kukuruzoning sarguzashtlari", description: "Vselovod Nestaykoning bolalar uchun qissasi. Robinzon Kukuruzoning sayohatlari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-158.pdf", language: "UZ", totalPages: 128, authorId: "author-86", categoryId: "cat-13", isPublished: true },
  { id: "book-159", title: "Besh bolali yigitcha", description: "Xudoyberdi To'xtaboyevning bolalar uchun romani. Besh bolali jasur yigitcha haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-159.pdf", language: "UZ", totalPages: 160, authorId: "author-87", categoryId: "cat-9", isPublished: true },
  { id: "book-160", title: "Quyonlar saltanatining shahanshohi", description: "Xudoyberdi To'xtaboyevning bolalar uchun romani. Quyonlar haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-160.pdf", language: "UZ", totalPages: 144, authorId: "author-87", categoryId: "cat-9", isPublished: true },
  { id: "book-161", title: "Sariq devni minib", description: "Xudoyberdi To'xtaboyevning bolalar uchun romani. Sariq dev bilan sayohat.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-161.pdf", language: "UZ", totalPages: 128, authorId: "author-87", categoryId: "cat-9", isPublished: true },
  { id: "book-162", title: "Sehrli qalpoqcha", description: "Xudoyberdi To'xtaboyevning bolalar uchun qissasi. Sehrli qalpoqcha haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-162.pdf", language: "UZ", totalPages: 96, authorId: "author-87", categoryId: "cat-10", isPublished: true },
  { id: "book-163", title: "Shirin qovunlar mamlakati", description: "Xudoyberdi To'xtaboyevning bolalar uchun romani. Shirin qovunlar mamlakatiga sayohat.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-163.pdf", language: "UZ", totalPages: 112, authorId: "author-87", categoryId: "cat-9", isPublished: true },
  { id: "book-164", title: "Hirotga sayohat", description: "Yo'ldosh Sulaymonning bolalar uchun sayohat hikoyasi (1997).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-164.pdf", language: "UZ", totalPages: 80, authorId: "author-88", categoryId: "cat-9", isPublished: true },
  { id: "book-165", title: "Tabiat mo'jizalari", description: "Yuriy Dmitriyevning bolalar uchun tabiat haqida ilmiy hikoyasi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-165.pdf", language: "UZ", totalPages: 96, authorId: "author-89", categoryId: "cat-16", isPublished: true },
  { id: "book-166", title: "Teddi", description: "Yuriy Kazakovning bolalar uchun hikoyasi. Ayiqchalar haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-166.pdf", language: "UZ", totalPages: 48, authorId: "author-90", categoryId: "cat-13", isPublished: true },
  { id: "book-167", title: "Dingo mening hamrohim", description: "Yuriy Yakovlevning bolalar uchun hikoyalar to'plami. Dingo iti haqida.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-167.pdf", language: "UZ", totalPages: 72, authorId: "author-91", categoryId: "cat-13", isPublished: true },
  { id: "book-168", title: "Bulutlar o'yini", description: "Zulfiyaning bolalar uchun she'rlar to'plami (1995).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-168.pdf", language: "UZ", totalPages: 48, authorId: "author-92", categoryId: "cat-14", isPublished: true },
  { id: "book-169", title: "Gullarim", description: "Zulfiyaning bolalar uchun she'rlar to'plami (1959).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-169.pdf", language: "UZ", totalPages: 40, authorId: "author-92", categoryId: "cat-14", isPublished: true },
  { id: "book-170", title: "Kapalak", description: "Zulfiyaning bolalar uchun she'rlar to'plami (1978).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-170.pdf", language: "UZ", totalPages: 36, authorId: "author-92", categoryId: "cat-14", isPublished: true },
  { id: "book-171", title: "Lolaqizg'aldoq", description: "Zulfiyaning bolalar uchun she'rlar to'plami (1970).", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-171.pdf", language: "UZ", totalPages: 44, authorId: "author-92", categoryId: "cat-14", isPublished: true },

  // ─── Category: Xalq og'zaki ijodi (cat-12) - child-friendly ───
  { id: "book-172", title: "Abu Muslim jangnomasi (2-kitob)", description: "O'zbek xalq og'zaki ijodidan Abu Muslim jangnomasining ikkinchi kitobi.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-172.pdf", language: "UZ", totalPages: 112, authorId: "author-95", categoryId: "cat-12", isPublished: true },
  { id: "book-173", title: "Afandi latifalari", description: "Nasriddin Afandining mashhur latifalari. Kulgili va hikmatli hikoyalar.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-173.pdf", language: "UZ", totalPages: 128, authorId: "author-94", categoryId: "cat-12", isPublished: true },
  { id: "book-174", title: "Alp Er To'nga yoki Afrosiyob jangnomasi", description: "O'zbek xalq og'zaki ijodidan Alp Er To'nga jangnomasi.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-174.pdf", language: "UZ", totalPages: 96, authorId: "author-96", categoryId: "cat-12", isPublished: true },
  { id: "book-175", title: "Asotirlar va rivoyatlar", description: "O'zbek xalq og'zaki ijodidan asotirlar va rivoyatlar to'plami.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-175.pdf", language: "UZ", totalPages: 144, authorId: "author-93", categoryId: "cat-12", isPublished: true },
  { id: "book-176", title: "Chittigul", description: "O'zbek xalq aytishuvlari, hazillari, o'yinlari va topishmoqlari to'plami.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-176.pdf", language: "UZ", totalPages: 80, authorId: "author-93", categoryId: "cat-12", isPublished: true },
  { id: "book-177", title: "Ilon pari", description: "O'zbek xalq fantastikasi. Ilon pari haqida ertak.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-177.pdf", language: "UZ", totalPages: 64, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-178", title: "Ipak yo'li afsonalari", description: "Ipak yo'li bo'ylab tarqalgan afsonalar to'plami.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-178.pdf", language: "UZ", totalPages: 112, authorId: "author-93", categoryId: "cat-12", isPublished: true },
  { id: "book-179", title: "Kulsa - gul, yig'lasa - dur", description: "O'zbek xalq ertaklari to'plami.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-179.pdf", language: "UZ", totalPages: 96, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-180", title: "Luqmoni hakim", description: "Luqmoni hakimning ertaklari va naqllari to'plami.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-180.pdf", language: "UZ", totalPages: 88, authorId: "author-98", categoryId: "cat-12", isPublished: true },
  { id: "book-181", title: "O'zbek topishmoqlari", description: "O'zbek xalqining boy topishmoqlar to'plami.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-181.pdf", language: "UZ", totalPages: 72, authorId: "author-93", categoryId: "cat-12", isPublished: true },
  { id: "book-182", title: "O'zbek xalq ertaklari. Oyjamol", description: "O'zbek xalq ertaklarining Oyjamol to'plami.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-182.pdf", language: "UZ", totalPages: 128, authorId: "author-97", categoryId: "cat-10", isPublished: true },
  { id: "book-183", title: "Oltin beshik", description: "O'zbek xalq ertaklaridan Oltin beshik to'plami.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-183.pdf", language: "UZ", totalPages: 96, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-184", title: "O'zbek xalq fantastikasi. Yonar daryo", description: "O'zbek xalq fantastikasidan Yonar daryo haqida ertak.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-184.pdf", language: "UZ", totalPages: 72, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-185", title: "Qorako'z oyim. Gulruh pari", description: "O'zbek xalq ertaklaridan Qorako'z oyim va Gulruh pari haqida.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-185.pdf", language: "UZ", totalPages: 64, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-186", title: "Suv qizi", description: "Fantastik ertaklar to'plami. Suv qizi haqida.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-186.pdf", language: "UZ", totalPages: 80, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-187", title: "O'zbek xalq maqollari", description: "O'zbek xalqining boy maqollar to'plami.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-187.pdf", language: "UZ", totalPages: 160, authorId: "author-93", categoryId: "cat-12", isPublished: true },
  { id: "book-188", title: "O'zbek xalq ijodi. Askiya", description: "O'zbek xalq ijodidan askiya va hazil namunalari.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-188.pdf", language: "UZ", totalPages: 108, authorId: "author-93", categoryId: "cat-12", isPublished: true },
  { id: "book-189", title: "O'zbek xalq ijodi. Topishmoqlar", description: "O'zbek xalq ijodidan topishmoqlar to'plami.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-189.pdf", language: "UZ", totalPages: 64, authorId: "author-93", categoryId: "cat-12", isPublished: true },
  { id: "book-190", title: "Oy oldida bir yulduz", description: "O'zbek xalq marosim qo'shiqlari to'plami.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-190.pdf", language: "UZ", totalPages: 88, authorId: "author-93", categoryId: "cat-12", isPublished: true },
  { id: "book-191", title: "O'zbek xalq qo'shiqlari", description: "O'zbek xalqining boy qo'shiqlar to'plami.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-191.pdf", language: "UZ", totalPages: 144, authorId: "author-93", categoryId: "cat-12", isPublished: true },
  { id: "book-192", title: "Hotamnoma", description: "Hotamnoma — o'zbek xalq og'zaki ijodining qadimiy namunasi.", coverUrl: "/covers/folklor/default.svg", pdfUrl: "pdfs/book-192.pdf", language: "UZ", totalPages: 96, authorId: "author-93", categoryId: "cat-12", isPublished: true },

  // ─── Category: Xalq dostonlari (cat-11) - child-friendly ───
  { id: "book-193", title: "Afandi latifalari (bolalar uchun)", description: "Nasriddin Afandining bolalar uchun moslashtirilgan latifalari.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-193.pdf", language: "UZ", totalPages: 80, authorId: "author-94", categoryId: "cat-11", isPublished: true },
  { id: "book-194", title: "Alpomishnoma. 1-kitob", description: "Malik Murodov va Abduolim Ergashev tayyorlagan Alpomishnoma.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-194.pdf", language: "UZ", totalPages: 128, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-195", title: "Alpomishnoma. 2-kitob", description: "Alpomishnomaning ikkinchi kitobi.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-195.pdf", language: "UZ", totalPages: 120, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-196", title: "Alpomish (doston). 1-qism", description: "Fozil Yo'ldosh o'g'li tomonidan aytilgan Alpomish dostonining birinchi qismi.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-196.pdf", language: "UZ", totalPages: 96, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-197", title: "Alpomish (doston). 2-qism", description: "Alpomish dostonining ikkinchi qismi.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-197.pdf", language: "UZ", totalPages: 104, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-198", title: "Nurali (doston)", description: "Fozil Yo'ldosh o'g'li tomonidan aytilgan Nurali dostoni.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-198.pdf", language: "UZ", totalPages: 88, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-199", title: "Shirin bilan Shakar (doston)", description: "Shirin va Shakar haqida o'zbek xalq dostoni.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-199.pdf", language: "UZ", totalPages: 80, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-200", title: "To'lg'onoy (doston)", description: "To'lg'onoy haqida o'zbek xalq dostoni.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-200.pdf", language: "UZ", totalPages: 72, authorId: "author-93", categoryId: "cat-11", isPublished: true },

  { id: "book-201", title: "O'zbek xalq dostonlari. 2-jild", description: "O'zbek xalq dostonlarining ikkinchi jildi.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-201.pdf", language: "UZ", totalPages: 176, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-202", title: "Xorazm dostonlari. Go'ro'g'li", description: "Xorazm xalq dostonlariidan Go'ro'g'li haqida.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-202.pdf", language: "UZ", totalPages: 96, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-203", title: "Xorazm dostonlari. Oshiqnoma. 1-kitob", description: "Xorazm xalq dostonlaridan Oshiqnomaning birinchi kitobi.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-203.pdf", language: "UZ", totalPages: 108, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-204", title: "Xorazm dostonlari. Oshiqnoma. 5-kitob", description: "Xorazm xalq dostonlaridan Oshiqnomaning beshinchi kitobi.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-204.pdf", language: "UZ", totalPages: 104, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-205", title: "Go'ro'g'li dostonlari. 4 jildlik. 2. Avazxon", description: "Go'ro'g'li dostonlarining to'rt jildlik to'plamining ikkinchi jildi.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-205.pdf", language: "UZ", totalPages: 144, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-206", title: "Shahriyori olam", description: "Xorazm xalq dostoni. Shahriyori olam haqida.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-206.pdf", language: "UZ", totalPages: 88, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-207", title: "Nuralining yutilishi", description: "Bo'ri baxshi Ahmedov tomonidan aytilgan Nuralining yutilishi dostoni.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-207.pdf", language: "UZ", totalPages: 80, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-208", title: "Nurali va qari Ahmad", description: "Boymurod Boymat o'g'li tomonidan aytilgan Nurali va qari Ahmad dostoni.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-208.pdf", language: "UZ", totalPages: 76, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-209", title: "Tohir va Zuhra (doston)", description: "Tohir va Zuhra haqida o'zbek xalq dostoni.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-209.pdf", language: "UZ", totalPages: 96, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-210", title: "Mirzo Hamdam qissasi", description: "Mirzo Hamdam qissasi — o'zbek xalq og'zaki ijodining noyob namunasi.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-210.pdf", language: "UZ", totalPages: 72, authorId: "author-99", categoryId: "cat-12", isPublished: true },
  { id: "book-211", title: "Qissai Mashrab", description: "Mashrab haqida o'zbek xalq qissasi.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-211.pdf", language: "UZ", totalPages: 88, authorId: "author-100", categoryId: "cat-12", isPublished: true },
  { id: "book-212", title: "Shoh Mashrab qissasi", description: "Shoh Mashrab haqida o'zbek xalq qissasi.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-212.pdf", language: "UZ", totalPages: 80, authorId: "author-100", categoryId: "cat-12", isPublished: true },
  { id: "book-213", title: "Zufunun qissasi", description: "Zufunun qissasi — o'zbek xalq og'zaki ijodining qadimiy namunasi.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-213.pdf", language: "UZ", totalPages: 64, authorId: "author-93", categoryId: "cat-12", isPublished: true },
  { id: "book-214", title: "Yusuf va Ahmad (doston)", description: "Yusuf va Ahmad haqida o'zbek xalq dostoni.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-214.pdf", language: "UZ", totalPages: 72, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-215", title: "Shoda-shoda marvardi", description: "O'zbek xalq qo'shiqlari to'plami.", coverUrl: "/covers/doston/default.svg", pdfUrl: "pdfs/book-215.pdf", language: "UZ", totalPages: 96, authorId: "author-93", categoryId: "cat-12", isPublished: true },

  // ─── Additional child-friendly folk tales (cat-10) ───
  { id: "book-216", title: "Mamatkarim (doston)", description: "Fozil Yo'ldosh o'g'li tomonidan aytilgan Mamatkarim dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-216.pdf", language: "UZ", totalPages: 72, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-217", title: "Mashriqo (doston)", description: "Fozil Yo'ldosh o'g'li tomonidan aytilgan Mashriqo dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-217.pdf", language: "UZ", totalPages: 68, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-218", title: "Intizor (doston)", description: "Fozil Yo'ldosh o'g'li tomonidan aytilgan Intizor dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-218.pdf", language: "UZ", totalPages: 80, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-219", title: "Balogardon (doston)", description: "Fozil Yo'ldosh o'g'li tomonidan aytilgan Balogardon dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-219.pdf", language: "UZ", totalPages: 76, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-220", title: "Rustamxon (doston)", description: "Fozil Yo'ldosh o'g'li tomonidan aytilgan Rustamxon dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-220.pdf", language: "UZ", totalPages: 84, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-221", title: "Jizzax qo'zg'oloni (doston)", description: "Fozil Yo'ldosh o'g'li tomonidan aytilgan Jizzax qo'zg'oloni dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-221.pdf", language: "UZ", totalPages: 92, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-222", title: "Malika ayyor (doston)", description: "Fozil Yo'ldosh o'g'li tomonidan aytilgan Malika ayyor dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-222.pdf", language: "UZ", totalPages: 88, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-223", title: "Zulfizar bilan Avazxon (doston)", description: "Fozil Yo'ldosh o'g'li tomonidan aytilgan Zulfizar bilan Avazxon dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-223.pdf", language: "UZ", totalPages: 80, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-224", title: "Hasanxon (doston)", description: "Po'lkan tomonidan aytilgan Hasanxon dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-224.pdf", language: "UZ", totalPages: 76, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-225", title: "Gulnor pari (doston)", description: "Po'lkan tomonidan aytilgan Gulnor pari dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-225.pdf", language: "UZ", totalPages: 68, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-226", title: "Misqol pari (doston)", description: "Po'lkan tomonidan aytilgan Misqol pari dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-226.pdf", language: "UZ", totalPages: 72, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-227", title: "Yunus pari (doston)", description: "Po'lkan tomonidan aytilgan Yunus pari dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-227.pdf", language: "UZ", totalPages: 64, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-228", title: "Xurshidoy (doston)", description: "Po'lkan tomonidan aytilgan Xurshidoy dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-228.pdf", language: "UZ", totalPages: 76, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-229", title: "Sarvinoz (doston)", description: "Rahmatulla Yusuf o'g'li tomonidan aytilgan Sarvinoz dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-229.pdf", language: "UZ", totalPages: 80, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-230", title: "Ro'zaxon (doston)", description: "Rahmatulla Yusuf o'g'li tomonidan aytilgan Ro'zaxon dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-230.pdf", language: "UZ", totalPages: 68, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-231", title: "Rayhon arab (doston)", description: "Rahmatulla Yusuf o'g'li tomonidan aytilgan Rayhon arab dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-231.pdf", language: "UZ", totalPages: 72, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-232", title: "Qirq yigit bilan qirq qiz (doston)", description: "Rahmatulla Yusuf o'g'li tomonidan aytilgan qirq yigit va qirq qiz haqida doston.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-232.pdf", language: "UZ", totalPages: 88, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-233", title: "Gulqizoy (doston)", description: "Rahmatulla Yusuf o'g'li tomonidan aytilgan Gulqizoy dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-233.pdf", language: "UZ", totalPages: 76, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-234", title: "Shoqalandar (doston)", description: "Rahmatulla Yusuf o'g'li tomonidan aytilgan Shoqalandar dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-234.pdf", language: "UZ", totalPages: 80, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-235", title: "Sumbulsoch beka (doston)", description: "Rahmatulla Yusuf o'g'li tomonidan aytilgan Sumbulsoch beka dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-235.pdf", language: "UZ", totalPages: 72, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-236", title: "Xiromon Dali (doston)", description: "Rahmatulla Yusuf o'g'li tomonidan aytilgan Xiromon Dali dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-236.pdf", language: "UZ", totalPages: 68, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-237", title: "Yosqila (doston)", description: "Rahmatulla Yusuf o'g'li tomonidan aytilgan Yosqila dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-237.pdf", language: "UZ", totalPages: 76, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-238", title: "Zulfizar (doston)", description: "Rahmatulla Yusuf o'g'li tomonidan aytilgan Zulfizar dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-238.pdf", language: "UZ", totalPages: 80, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-239", title: "Avazxon (doston)", description: "Rahmatulla Yusuf o'g'li tomonidan aytilgan Avazxon dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-239.pdf", language: "UZ", totalPages: 92, authorId: "author-93", categoryId: "cat-10", isPublished: true },
  { id: "book-240", title: "Bozirgon (doston)", description: "Rahmatulla Yusuf o'g'li tomonidan aytilgan Bozirgon dostoni.", coverUrl: "/covers/ertak/default.svg", pdfUrl: "pdfs/book-240.pdf", language: "UZ", totalPages: 76, authorId: "author-93", categoryId: "cat-10", isPublished: true },

  // ─── Additional child-friendly books (cat-15, cat-9) ───
  { id: "book-241", title: "Buxoro dostonlari. Go'ro'g'lining tug'ilishi", description: "Rahmatulla Yusuf o'g'li tomonidan aytilgan Go'ro'g'lining tug'ilishi dostoni.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-241.pdf", language: "UZ", totalPages: 84, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-242", title: "Buxoro dostonlari. Go'ro'g'lining o'limi", description: "Go'ro'g'lining o'limi haqida doston.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-242.pdf", language: "UZ", totalPages: 80, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-243", title: "Buxoro dostonlari. Go'ro'g'lining bolaligi", description: "Go'ro'g'lining bolaligi haqida doston.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-243.pdf", language: "UZ", totalPages: 72, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-244", title: "Buxoro dostonlari. Nuralining yoshligi", description: "Nuralining yoshligi haqida doston.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-244.pdf", language: "UZ", totalPages: 76, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-245", title: "Buxoro dostonlari. Oygulqizning vafoti", description: "Oygulqizning vafoti haqida doston.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-245.pdf", language: "UZ", totalPages: 68, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-246", title: "Buxoro dostonlari. Avaz o'g'lonning Rumga qochishi", description: "Avaz o'g'lonning Rumga qochishi haqida doston.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-246.pdf", language: "UZ", totalPages: 88, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-247", title: "Buxoro dostonlari. Gavdaroz dev", description: "Gavdaroz dev haqida doston.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-247.pdf", language: "UZ", totalPages: 72, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-248", title: "Buxoro dostonlari. Chortoqli Chambil", description: "Chortoqli Chambil haqida doston.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-248.pdf", language: "UZ", totalPages: 80, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-249", title: "Boychechak (Bolalar folklori)", description: "Oxunjon Safarov va Kamol Ochilov tayyorlagan bolalar folklori va mehnat qo'shiqlari to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-249.pdf", language: "UZ", totalPages: 96, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-250", title: "Buxoro dostonlari. Ahmad Sardorning o'limga mahkum qilinishi", description: "Ahmad Sardorning o'limga mahkum qilinishi haqida doston.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-250.pdf", language: "UZ", totalPages: 84, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-251", title: "Buxoro dostonlari. Besh podshoning Chambilga yov bo'lib kelishi", description: "Besh podshoning Chambilga yov bo'lib kelishi haqida doston.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-251.pdf", language: "UZ", totalPages: 92, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-252", title: "Buxoro dostonlari. Balogardon", description: "Rahmatulla Yusuf o'g'li tomonidan aytilgan Balogardon dostoni.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-252.pdf", language: "UZ", totalPages: 76, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-253", title: "Buxoro dostonlari. Zulfizar", description: "Rahmatulla Yusuf o'g'li tomonidan aytilgan Zulfizar dostoni.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-253.pdf", language: "UZ", totalPages: 80, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-254", title: "Buxoro dostonlari. Hasanxon", description: "Rahmatulla Yusuf o'g'li tomonidan aytilgan Hasanxon dostoni.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-254.pdf", language: "UZ", totalPages: 72, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-255", title: "Ergash Jumanbulbul o'g'li. Bulbul taronalari. 4-jild", description: "Ergash Jumanbulbul o'g'li tomonidan aytilgan Bulbul taronalari to'plamining to'rtinchi jildi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-255.pdf", language: "UZ", totalPages: 108, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-256", title: "Ergash Jumanbulbul o'g'li. Bulbul taronalari. 5-jild", description: "Bulbul taronalari to'plamining beshinchi jildi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-256.pdf", language: "UZ", totalPages: 112, authorId: "author-93", categoryId: "cat-15", isPublished: true },
  { id: "book-257", title: "Boychechak (Mejnatsiz qo'shiqlar)", description: "Bolalar uchun mehnatsiz qo'shiqlar to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-257.pdf", language: "UZ", totalPages: 64, authorId: "author-93", categoryId: "cat-9", isPublished: true },
  { id: "book-258", title: "Xalq og'zaki ijodi. Askiya", description: "Rasul Muhammadiyev to'plagan o'zbek xalq ijodidan askiyalar.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-258.pdf", language: "UZ", totalPages: 96, authorId: "author-93", categoryId: "cat-9", isPublished: true },
  { id: "book-259", title: "Xalq og'zaki ijodi. Topishmoqlar", description: "Zubayda Husainova tayyorlagan o'zbek xalq topishmoqlari to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-259.pdf", language: "UZ", totalPages: 72, authorId: "author-93", categoryId: "cat-9", isPublished: true },
  { id: "book-260", title: "Bolalar uchun O'zbek xalq ertaklari", description: "O'zbek xalq ertaklaridan bolalar uchun maxsus tanlangan to'plam.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-260.pdf", language: "UZ", totalPages: 144, authorId: "author-97", categoryId: "cat-10", isPublished: true },
  { id: "book-261", title: "Sovet davri xalq qo'shiqlari", description: "Sovet davrida ijro etilgan xalq qo'shiqlari to'plami.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-261.pdf", language: "UZ", totalPages: 108, authorId: "author-93", categoryId: "cat-12", isPublished: true },
  { id: "book-262", title: "Qadim Surxon navolari", description: "Muzaffar Naimovning qadimiy Surxondaryo navlari haqida kitobi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-262.pdf", language: "UZ", totalPages: 80, authorId: "author-93", categoryId: "cat-12", isPublished: true },
  { id: "book-263", title: "Gulyor (Farg'ona xalq qo'shiqlari)", description: "Hoshimjon Razzoqov to'plagan Farg'ona xalq qo'shiqlari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-263.pdf", language: "UZ", totalPages: 96, authorId: "author-93", categoryId: "cat-12", isPublished: true },
  { id: "book-264", title: "Xorazm dostonlari. Oshiqnoma. 3-kitob", description: "Xorazm xalq dostonlaridan Oshiqnomaning uchinchi kitobi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-264.pdf", language: "UZ", totalPages: 104, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-265", title: "Xorazm dostonlari. Oshiqnoma. 4-kitob", description: "Xorazm xalq dostonlaridan Oshiqnomaning to'rtinchi kitobi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-265.pdf", language: "UZ", totalPages: 100, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-266", title: "Xorazm dostonlari. Oshiqnoma. 2-kitob", description: "Xorazm xalq dostonlaridan Oshiqnomaning ikkinchi kitobi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-266.pdf", language: "UZ", totalPages: 108, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-267", title: "Xorazm dostonlari. Oshiqnoma. 6-kitob", description: "Xorazm xalq dostonlaridan Oshiqnomaning oltinchi kitobi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-267.pdf", language: "UZ", totalPages: 100, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-268", title: "Xorazm dostonlari. Oshiqnoma. 7-kitob", description: "Xorazm xalq dostonlaridan Oshiqnomaning yettinchi kitobi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-268.pdf", language: "UZ", totalPages: 96, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-269", title: "Xorazm dostonlari. Oshiqnoma. 8-kitob", description: "Xorazm xalq dostonlaridan Oshiqnomaning sakkizinchi kitobi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-269.pdf", language: "UZ", totalPages: 92, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-270", title: "Xorazm dostonlari. Oshiqnoma. 9-kitob", description: "Xorazm xalq dostonlaridan Oshiqnomaning to'qqizinchi kitobi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-270.pdf", language: "UZ", totalPages: 88, authorId: "author-93", categoryId: "cat-11", isPublished: true },

  // ─── Last 4 books to reach exactly 250 children's books ───
  // (book-25 to book-274 = 250 children's books)
  { id: "book-271", title: "Xorazm dostonlari. Oshiqnoma. 10-kitob", description: "Xorazm xalq dostonlaridan Oshiqnomaning o'ninchi kitobi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-271.pdf", language: "UZ", totalPages: 88, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-272", title: "Ergash Jumanbulbul o'g'li. 2 jidlik. 1-jild", description: "Ergash Jumanbulbul o'g'li tomonidan aytilgan 2 jidlik dostonining birinchi jildi.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-272.pdf", language: "UZ", totalPages: 108, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-273", title: "Ergash Jumanbulbul o'g'li. Dalli. Xushkeldi", description: "Ergash Jumanbulbul o'g'li tomonidan aytilgan Dalli va Xushkeldi dostonlari.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-273.pdf", language: "UZ", totalPages: 96, authorId: "author-93", categoryId: "cat-11", isPublished: true },
  { id: "book-274", title: "Xudoyberdi To'xtaboyev. Sariq devni minib (bolalar uchun)", description: "Xudoyberdi To'xtaboyevning bolalar uchun eng mashhur asari. Sariq devni minib sayohat.", coverUrl: "/covers/bolalar/default.svg", pdfUrl: "pdfs/book-274.pdf", language: "UZ", totalPages: 128, authorId: "author-87", categoryId: "cat-9", isPublished: true },
];

const READING_PROGRESS = [
  { userId: "user-1", bookId: "book-1", currentPage: 2, progress: 33, startedAt: "2025-09-10T08:00:00Z", lastReadAt: "2025-09-20T14:30:00Z", completedAt: null },
  { userId: "user-1", bookId: "book-2", currentPage: 3, progress: 60, startedAt: "2025-09-05T10:00:00Z", lastReadAt: "2025-09-19T16:00:00Z", completedAt: null },
  { userId: "user-1", bookId: "book-36", currentPage: 1, progress: 20, startedAt: "2025-09-15T09:00:00Z", lastReadAt: "2025-09-18T11:00:00Z", completedAt: null },
  { userId: "user-2", bookId: "book-50", currentPage: 4, progress: 67, startedAt: "2025-09-08T12:00:00Z", lastReadAt: "2025-09-20T18:00:00Z", completedAt: null },
  { userId: "user-3", bookId: "book-133", currentPage: 5, progress: 100, startedAt: "2025-09-01T10:00:00Z", lastReadAt: "2025-09-15T20:00:00Z", completedAt: "2025-09-15T20:00:00Z" },
  { userId: "user-2", bookId: "book-82", currentPage: 2, progress: 40, startedAt: "2025-09-12T08:00:00Z", lastReadAt: "2025-09-20T10:00:00Z", completedAt: null },
  { userId: "user-3", bookId: "book-86", currentPage: 2, progress: 50, startedAt: "2025-09-14T09:00:00Z", lastReadAt: "2025-09-19T15:00:00Z", completedAt: null },
  { userId: "user-4", bookId: "book-98", currentPage: 5, progress: 100, startedAt: "2025-09-03T07:00:00Z", lastReadAt: "2025-09-10T20:00:00Z", completedAt: "2025-09-10T20:00:00Z" },
  { userId: "user-4", bookId: "book-100", currentPage: 3, progress: 60, startedAt: "2025-09-11T10:00:00Z", lastReadAt: "2025-09-18T12:00:00Z", completedAt: null },
  { userId: "user-5", bookId: "book-87", currentPage: 3, progress: 60, startedAt: "2025-09-07T08:00:00Z", lastReadAt: "2025-09-20T16:00:00Z", completedAt: null },
  { userId: "user-6", bookId: "book-29", currentPage: 1, progress: 25, startedAt: "2025-09-09T14:00:00Z", lastReadAt: "2025-09-19T09:00:00Z", completedAt: null },
  { userId: "user-7", bookId: "book-159", currentPage: 2, progress: 40, startedAt: "2025-09-13T11:00:00Z", lastReadAt: "2025-09-18T17:00:00Z", completedAt: null },
];

const BOOKMARKS = [
  { userId: "user-1", bookId: "book-36", page: 50, note: "Kichkina shahzoda - asosiy g'oya", createdAt: "2025-09-12T10:00:00Z" },
  { userId: "user-1", bookId: "book-29", page: 100, note: "Pushkin ertaklari", createdAt: "2025-09-15T14:00:00Z" },
  { userId: "user-1", bookId: "book-98", page: 45, note: null, createdAt: "2025-09-08T09:00:00Z" },
  { userId: "user-2", bookId: "book-82", page: 30, note: "Gulliver sayohati", createdAt: "2025-09-13T08:00:00Z" },
  { userId: "user-3", bookId: "book-86", page: 75, note: "Pinokkio", createdAt: "2025-09-15T10:00:00Z" },
  { userId: "user-4", bookId: "book-100", page: 40, note: null, createdAt: "2025-09-12T11:00:00Z" },
  { userId: "user-5", bookId: "book-87", page: 100, note: "Alisa sayohati", createdAt: "2025-09-09T10:00:00Z" },
];

const FAVORITES = [
  { userId: "user-1", bookId: "book-36", createdAt: "2025-09-10T08:00:00Z" },
  { userId: "user-1", bookId: "book-29", createdAt: "2025-09-05T10:00:00Z" },
  { userId: "user-1", bookId: "book-133", createdAt: "2025-09-16T09:00:00Z" },
  { userId: "user-2", bookId: "book-133", createdAt: "2025-09-08T12:00:00Z" },
  { userId: "user-2", bookId: "book-82", createdAt: "2025-09-12T08:00:00Z" },
  { userId: "user-3", bookId: "book-86", createdAt: "2025-09-14T09:00:00Z" },
  { userId: "user-3", bookId: "book-133", createdAt: "2025-09-01T10:00:00Z" },
  { userId: "user-4", bookId: "book-98", createdAt: "2025-09-03T07:00:00Z" },
  { userId: "user-5", bookId: "book-87", createdAt: "2025-09-07T08:00:00Z" },
  { userId: "user-5", bookId: "book-159", createdAt: "2025-09-10T11:00:00Z" },
];

const RATINGS = [
  { userId: "user-1", bookId: "book-36", rating: 5 },
  { userId: "user-1", bookId: "book-29", rating: 5 },
  { userId: "user-1", bookId: "book-50", rating: 4 },
  { userId: "user-2", bookId: "book-133", rating: 4 },
  { userId: "user-2", bookId: "book-82", rating: 5 },
  { userId: "user-3", bookId: "book-133", rating: 5 },
  { userId: "user-3", bookId: "book-86", rating: 4 },
  { userId: "user-4", bookId: "book-98", rating: 5 },
  { userId: "user-4", bookId: "book-100", rating: 4 },
  { userId: "user-5", bookId: "book-87", rating: 4 },
  { userId: "user-5", bookId: "book-159", rating: 5 },
  { userId: "user-6", bookId: "book-29", rating: 4 },
  { userId: "user-7", bookId: "book-159", rating: 4 },
];

const SESSIONS_DATA = [
  { userId: "user-1", bookId: "book-36", startPage: 1, endPage: 2, pagesRead: 2, duration: 720, startedAt: "2025-09-10T08:00:00Z" },
  { userId: "user-1", bookId: "book-29", startPage: 1, endPage: 3, pagesRead: 3, duration: 1080, startedAt: "2025-09-05T10:00:00Z" },
  { userId: "user-1", bookId: "book-50", startPage: 1, endPage: 1, pagesRead: 1, duration: 300, startedAt: "2025-09-15T09:00:00Z" },
  { userId: "user-1", bookId: "book-86", startPage: 1, endPage: 4, pagesRead: 4, duration: 1200, startedAt: "2025-08-01T08:00:00Z" },
  { userId: "user-2", bookId: "book-133", startPage: 1, endPage: 4, pagesRead: 4, duration: 1440, startedAt: "2025-09-08T12:00:00Z" },
  { userId: "user-2", bookId: "book-82", startPage: 1, endPage: 2, pagesRead: 2, duration: 600, startedAt: "2025-09-12T08:00:00Z" },
  { userId: "user-2", bookId: "book-133", startPage: 1, endPage: 5, pagesRead: 5, duration: 1500, startedAt: "2025-08-05T10:00:00Z" },
  { userId: "user-3", bookId: "book-133", startPage: 1, endPage: 5, pagesRead: 5, duration: 1500, startedAt: "2025-09-01T10:00:00Z" },
  { userId: "user-3", bookId: "book-86", startPage: 1, endPage: 2, pagesRead: 2, duration: 900, startedAt: "2025-09-14T09:00:00Z" },
  { userId: "user-3", bookId: "book-29", startPage: 1, endPage: 5, pagesRead: 5, duration: 1500, startedAt: "2025-08-01T10:00:00Z" },
  { userId: "user-4", bookId: "book-98", startPage: 1, endPage: 5, pagesRead: 5, duration: 1200, startedAt: "2025-09-03T07:00:00Z" },
  { userId: "user-4", bookId: "book-100", startPage: 1, endPage: 3, pagesRead: 3, duration: 480, startedAt: "2025-09-11T10:00:00Z" },
  { userId: "user-5", bookId: "book-87", startPage: 1, endPage: 3, pagesRead: 3, duration: 600, startedAt: "2025-09-07T08:00:00Z" },
  { userId: "user-5", bookId: "book-159", startPage: 1, endPage: 2, pagesRead: 2, duration: 400, startedAt: "2025-09-10T11:00:00Z" },
  { userId: "user-6", bookId: "book-29", startPage: 1, endPage: 1, pagesRead: 1, duration: 300, startedAt: "2025-09-09T14:00:00Z" },
  { userId: "user-6", bookId: "book-86", startPage: 1, endPage: 2, pagesRead: 2, duration: 600, startedAt: "2025-08-15T08:00:00Z" },
  { userId: "user-7", bookId: "book-159", startPage: 1, endPage: 2, pagesRead: 2, duration: 400, startedAt: "2025-09-13T11:00:00Z" },
];

const BANNERS = [
  { title: "Xush kelibsiz!", description: "MBSI Library — bolalar uchun eng yaxshi kitoblar", imageUrl: "/covers/bolalar/default.svg", link: "/", order: 1, isActive: true },
  { title: "Yangi kitoblar", description: "Ziyouz.com kutubxonasidan bolalar uchun kitoblar", imageUrl: "/covers/bolalar/default.svg", link: "/books", order: 2, isActive: true },
  { title: "O'qishni boshlang", description: "250 ta bolalar kitobini o'qing", imageUrl: "/covers/bolalar/default.svg", link: "/books", order: 3, isActive: true },
];

const RECOMMENDATIONS = [
  { title: "Haftaning tavsiyasi", description: "Kichkina shahzoda — antuan de Sent-Ekzyuperi", bookId: "book-36", order: 1, isActive: true },
  { title: "Yangi kitoblar", description: "Pushkin ertaklari bolalar uchun", bookId: "book-29", order: 2, isActive: true },
  { title: "O'quvchilar uchun", description: "Maugli — Redyard Kipling", bookId: "book-133", order: 3, isActive: true },
  { title: "O'qituvchilar uchun", description: "Alisa mo'jizalar mamlakatida", bookId: "book-98", order: 4, isActive: true },
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

  // 6. Reading Sessions
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

  // 10. Banners
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

  // 11. Recommendations
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

  // 12. Audit Logs
  console.log("📝 Seeding audit logs...");
  await prisma.auditLog.deleteMany();
  const auditEntries = [
    { userId: "user-8", action: "CREATE_BOOK", entity: "Book", entityId: "book-36", metadata: { title: "Kichkina shahzoda", published: true } },
    { userId: "user-8", action: "CREATE_BOOK", entity: "Book", entityId: "book-29", metadata: { title: "Ertaklar (Pushkin)", published: true } },
    { userId: "user-8", action: "PUBLISH_BOOK", entity: "Book", entityId: "book-133", metadata: { title: "Maugli" } },
    { userId: "user-8", action: "CREATE_USER", entity: "User", entityId: "user-1", metadata: { name: "Muhammadamin Toshtemirov", role: "STUDENT" } },
    { userId: "user-8", action: "UPDATE_BOOK", entity: "Book", entityId: "book-50", metadata: { title: "Mittivoy va Karlson" } },
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

  const childBooks = BOOKS.filter(b => ["cat-9", "cat-10", "cat-11", "cat-12", "cat-13", "cat-14", "cat-15", "cat-16"].includes(b.categoryId));
  console.log("\n🎉 Database seeded successfully!\n");
  console.log("Summary:");
  console.log(`   👤 Users:          ${USERS.length}`);
  console.log(`   ✍️  Authors:        ${AUTHORS.length}`);
  console.log(`   📂 Categories:     ${CATEGORIES.length}`);
  console.log(`   📚 Books:          ${BOOKS.length} total (${childBooks.length} children's books from ziyouz.com)`);
  console.log(`   📖 Reading Progress: ${READING_PROGRESS.length}`);
  console.log(`   📊 Sessions:       ${SESSIONS_DATA.length}`);
  console.log(`   🔖 Bookmarks:      ${BOOKMARKS.length}`);
  console.log(`   ❤️  Favorites:      ${FAVORITES.length}`);
  console.log(`   ⭐ Ratings:        ${RATINGS.length}`);
  console.log(`   🖼️  Banners:        ${BANNERS.length}`);
  console.log(`   💡 Recommendations: ${RECOMMENDATIONS.length}`);
  console.log(`   📝 Audit Logs:     ${auditEntries.length}`);
  console.log(`\n   📊 ziyouz.com kutubxonasidan olingan ma'lumotlar:`);
  console.log(`      - Jami kitoblar soni: 5,008`);
  console.log(`      - Bolalar kutubxonasi: 148 ta kitob`);
  console.log(`      - O'zbek xalq og'zaki ijodi: 116 ta kitob`);
  console.log(`      - Tanlab olingan (bolalar uchun mos): ${childBooks.length} ta kitob`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
