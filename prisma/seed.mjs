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

// ── Mualliflar: kutubxonadagi real asarlar mualliflari ──
const AUTHORS = [
  { id: "a-qodiriy", name: "Abdulla Qodiriy", biography: "O'zbek adabiyotining klassiki, \"O'tkan kunlar\" romani muallifi." },
  { id: "a-qahhor", name: "Abdulla Qahhor", biography: "O'zbek xalq yozuvchisi, \"Sarob\" va \"Qo'shchinor chiroqlari\" romanlari muallifi." },
  { id: "a-fitrat", name: "Abdurauf Fitrat", biography: "Jadid yozuvchisi, tarixchi va ma'rifatparvar." },
  { id: "a-cholpon", name: "Abdulhamid Cho'lpon", biography: "Shoir, yozuvchi, dramaturg va tarjimon." },
  { id: "a-ismoil", name: "Abdulhamid Ismoil", biography: "Zamonaviy o'zbek yozuvchisi." },
  { id: "a-kocar", name: "Abdulhamid Ko'char", biography: "O'zbek yozuvchisi va tarixchi-o'lkashunos." },
  { id: "a-abbos-said", name: "Abbos Said", biography: "Zamonaviy o'zbek yozuvchisi." },
  { id: "a-ayizov", name: "Abdulla Ayizov", biography: "O'zbek yozuvchisi." },
  { id: "a-chimirzayev", name: "Abdulla Chimirzayev", biography: "O'zbek yozuvchisi." },
  { id: "a-abdumutal", name: "Abdumutal Abdullayev", biography: "O'zbek yozuvchisi." },
  { id: "a-abdiyev", name: "Abdunabi Abdiyev", biography: "O'zbek yozuvchisi." },
  { id: "a-hamro", name: "Abdunabi Hamro", biography: "Zamonaviy o'zbek yozuvchisi." },
  { id: "a-ibrohimov", name: "Abduqahhor Ibrohimov", biography: "O'zbek yozuvchisi va tarjimon." },
  { id: "a-yoldosh", name: "Abduqayum Yo'ldosh", biography: "O'zbek yozuvchisi, \"Timsohning ko'z yoshlari\" muallifi." },
  { id: "a-abdurahmon", name: "Abdurahmon Karimov", biography: "O'zbek yozuvchisi." },
  { id: "a-nurmurodov", name: "Abdurashid Nurmurodov", biography: "O'zbek yozuvchisi." },
  { id: "a-pardayev", name: "Abdurashid Pardayev", biography: "Zamonaviy o'zbek yozuvchisi." },
  { id: "a-kochimov", name: "Abdusaid Ko'chimov", biography: "O'zbek yozuvchisi." },
  { id: "a-hotamov", name: "Abdusattor Hotamov", biography: "O'zbek yozuvchisi." },
  { id: "a-sodiqov", name: "Abdusattor Sodiqov", biography: "O'zbek yozuvchisi." },
  { id: "a-mamarasulov", name: "Abulqosim Mamarasulov", biography: "O'zbek yozuvchisi." },
  { id: "a-damin", name: "Adham Damin", biography: "Zamonaviy o'zbek yozuvchisi." },
  { id: "a-tohirov", name: "Afzal Tohirov", biography: "O'zbek yozuvchisi va adabiyotshunos." },
  { id: "a-ahad-hasan", name: "Ahad Hasan", biography: "O'zbek yozuvchisi." },
  { id: "a-azam", name: "Ahmad A'zam", biography: "Zamonaviy o'zbek yozuvchisi." },
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
const UZ_BOOKS = [
  // ── Abdulla Qahhor ──
  { t: "Asarlar. 1-jild: Sarob (roman)", c: "abdulla-qahhor-asarlar-1-jild-sarob-roman", a: "a-qahhor", p: 512 },
  { t: "Asarlar. 5 jildlik. 2-jild: Qo'shchinor chiroqlari", c: "abdulla-qahhor-asarlar-5-jildlik-2-jild-qoshchinor-chiroqlari", a: "a-qahhor", p: 496 },
  { t: "Asarlar. 5 jildlik. 3-jild: O'tmishdan ertaklar", c: "abdulla-qahhor-asarlar-5-jildlik-3-jild-otmishdan-ertaklar", a: "a-qahhor", p: 464 },
  { t: "Asarlar. 6 tomlik. 3-tom (1967)", c: "abdulla-qahhor-asarlar-6-tomlik-3-tom-1967", a: "a-qahhor", p: 528 },
  { t: "Asarlar. 6 tomlik. 4-tom (1967)", c: "abdulla-qahhor-asarlar-6-tomlik-4-tom-1967", a: "a-qahhor", p: 536 },
  { t: "Asarlar. 6 tomlik. 6-tom (1971)", c: "abdulla-qahhor-asarlar-6-tomlik-6-tom-1971", a: "a-qahhor", p: 544 },
  { t: "Dahshat (hikoyalar to'plami)", c: "abdulla-qahhor-dahshat-hikoyalar-toplami", a: "a-qahhor", p: 208 },
  { t: "Hikoyalar (1933)", c: "abdulla-qahhor-hikoyalar-1933", a: "a-qahhor", p: 176 },
  { t: "Hikoyalar (1949)", c: "abdulla-qahhor-hikoyalar-1949", a: "a-qahhor", p: 232 },
  { t: "Ming bir jon (1959)", c: "abdulla-qahhor-ming-bir-jon-1959", a: "a-qahhor", p: 312 },
  { t: "Muhabbat (qissa)", c: "abdulla-qahhor-muhabbat-qissa", a: "a-qahhor", p: 160 },
  { t: "Nurli cho'qqilar (1967)", c: "abdulla-qahhor-nurli-choqqilar-1967", a: "a-qahhor", p: 288 },
  { t: "Oltin yulduz (1965)", c: "abdulla-qahhor-oltin-yulduz-1965", a: "a-qahhor", p: 328 },
  { t: "Oltin yulduz (qissa)", c: "abdulla-qahhor-oltin-yulduz-qissa", a: "a-qahhor", p: 184 },
  { t: "O'tmishdan ertaklar (1976)", c: "abdulla-qahhor-otmishdan-ertaklar-1976", a: "a-qahhor", p: 360 },
  { t: "O'tmishdan ertaklar (qissa)", c: "abdulla-qahhor-otmishdan-ertaklar-qissa", a: "a-qahhor", p: 216 },
  { t: "Portretlar, felyetonlar", c: "abdulla-qahhor-portretlar-felyetonlar", a: "a-qahhor", p: 248 },
  { t: "Qanotsiz chittak (1937)", c: "abdulla-qahhor-qanotsiz-chittak-1937", a: "a-qahhor", p: 144 },
  { t: "Qo'shchinor chiroqlari (roman)", c: "abdulla-qahhor-qoshchinor-chiroqlari-roman", a: "a-qahhor", p: 344 },
  { t: "Qotilning tug'ilishi (1933)", c: "abdulla-qahhor-qotilning-tugilishi-1933", a: "a-qahhor", p: 152 },
  { t: "Sarob (roman)", c: "abdulla-qahhor-sarob-roman", a: "a-qahhor", p: 384 },
  { t: "Sinchalak (1960)", c: "abdulla-qahhor-sinchalak-1960", a: "a-qahhor", p: 264 },
  { t: "Sinchalak (qissa)", c: "abdulla-qahhor-sinchalak-qissa", a: "a-qahhor", p: 192 },
  { t: "Tanlangan asarlar. 3 tomlik. 1-tom (1957)", c: "abdulla-qahhor-tanlangan-asarlar-3-tomlik-1-tom-1957", a: "a-qahhor", p: 480 },
  { t: "Tanlangan asarlar. 3 tomlik. 2-tom (1957)", c: "abdulla-qahhor-tanlangan-asarlar-3-tomlik-2-tom-1957", a: "a-qahhor", p: 472 },
  { t: "Tanlangan asarlar. 3 tomlik. 3-tom (1956)", c: "abdulla-qahhor-tanlangan-asarlar-3-tomlik-3-tom-1956", a: "a-qahhor", p: 440 },
  // ── Abdulla Qodiriy ──
  { t: "Diyori bakr", c: "abdulla-qodiriy-diyori-bakr", a: "a-qodiriy", p: 96 },
  { t: "G'irvonlik Mallavoy (1987)", c: "abdulla-qodiriy-girvonlik-mallavoy-1987", a: "a-qodiriy", p: 224 },
  { t: "Jinlar bazmi (hikoyalar)", c: "abdulla-qodiriy-jinlar-bazmi-hikoyalar", a: "a-qodiriy", p: 256 },
  { t: "Mehrobdan chayon (1967)", c: "abdulla-qodiriy-mehrobdan-chayon-1967", a: "a-qodiriy", p: 320 },
  { t: "Mehrobdan chayon (roman)", c: "abdulla-qodiriy-mehrobdan-chayon-roman", a: "a-qodiriy", p: 352 },
  { t: "O'bid ketmon (1959)", c: "abdulla-qodiriy-obid-ketmon-1959", a: "a-qodiriy", p: 368 },
  { t: "O'tkan kunlar (1974)", c: "abdulla-qodiriy-otkan-kunlar-1974", a: "a-qodiriy", p: 400 },
  { t: "O'tkan kunlar (roman)", c: "abdulla-qodiriy-otkan-kunlar-roman", a: "a-qodiriy", p: 432 },
  { t: "To'la asarlar to'plami. 6 jildlik. 1-jild", c: "abdulla-qodiriy-tola-asarlar-toplami-6-jildlik-1-jild", a: "a-qodiriy", p: 560 },
  // ── Abdurauf Fitrat ──
  { t: "Hindistonda bir farangi ila buxorolik mudarrisning munozarasi", c: "abdurauf-fitrat-hindistonda-bir-farangi-ila-buxorolik-mudarrisning-munozarasi", a: "a-fitrat", p: 128 },
  { t: "Hind sayyohining qissasi", c: "abdurauf-fitrat-hind-sayyohining-qissasi", a: "a-fitrat", p: 144 },
  { t: "Tanlangan asarlar. 1-jild", c: "abdurauf-fitrat-tanlangan-asarlar-1-jild", a: "a-fitrat", p: 480 },
  // ── Abdulhamid Cho'lpon ──
  { t: "Hikoyalar, tarjimalar", c: "abdulhamid-cholpon-hikoyalar-tarjimalar", a: "a-cholpon", p: 288 },
  // ── Abdulhamid Ismoil ──
  { t: "Jinlar bazmi", c: "abdulhamid-ismoil-jinlar-bazmi", a: "a-ismoil", p: 272 },
  { t: "Manaschi (roman)", c: "abdulhamid-ismoil-manaschi-roman", a: "a-ismoil", p: 336 },
  { t: "Murtad (qissa)", c: "abdulhamid-ismoil-murtad-qissa", a: "a-ismoil", p: 208 },
  // ── Abdulhamid Ko'char ──
  { t: "Qullikdan hurlikka", c: "abdulhamid-kochar-qullikdan-hurlikka", a: "a-kocar", p: 240 },
  // ── Abbos Said ──
  { t: "Qariya (qissalar, hikoyalar)", c: "abbos-said-qariya-qissalar-hikoyalar", a: "a-abbos-said", p: 192 },
  // ── Abdulla Ayizov ──
  { t: "Polvon yig'lagan tun (qissa)", c: "abdulla-ayizov-polvon-yiglagan-tun-qissa", a: "a-ayizov", p: 176 },
  // ── Abdulla Chimirzayev ──
  { t: "Hayot yog'dulari (hikoyalar)", c: "abdulla-chimirzayev-hayot-yogdulari-hikoyalar", a: "a-chimirzayev", p: 208 },
  // ── Abdumutal Abdullayev ──
  { t: "Alushta ertagi (qissa)", c: "abdumutal-abdullayev-alushta-ertagi-qissa", a: "a-abdumutal", p: 168 },
  { t: "Dard (qissa)", c: "abdumutal-abdullayev-dard-qissa", a: "a-abdumutal", p: 192 },
  { t: "Hazrati Attor (qissa)", c: "abdumutal-abdullayev-hazrati-attor-qissa", a: "a-abdumutal", p: 224 },
  // ── Abdunabi Abdiyev ──
  { t: "Muallaq odam (qissa)", c: "abdunabi-abdiyev-muallaq-odam-qissa", a: "a-abdiyev", p: 184 },
  // ── Abdunabi Hamro ──
  { t: "Vaqt daryosi", c: "abdunabi-hamro-vaqt-daryosi", a: "a-hamro", p: 216 },
  // ── Abduqahhor Ibrohimov ──
  { t: "Osmon yaqin, yer yumshoq (1982)", c: "abduqahhor-ibrohimov-osmon-yaqin-yer-yumshoq-1982", a: "a-ibrohimov", p: 288 },
  { t: "Uyqu kelmas kechalar (roman)", c: "abduqahhor-ibrohimov-uyqu-kelmas-kechalar-roman", a: "a-ibrohimov", p: 320 },
  // ── Abduqayum Yo'ldosh ──
  { t: "Otchopar yoxud o'n uchinchi uy (qissa)", c: "abduqayum-yoldosh-otchopar-yoxud-on-uchinchi-uy-qissa", a: "a-yoldosh", p: 200 },
  { t: "Sunbulaning ilk shanbasi (qissa)", c: "abduqayum-yoldosh-sunbulaning-ilk-shanbasi-qissa", a: "a-yoldosh", p: 176 },
  { t: "Timsohning ko'z yoshlari", c: "abduqayum-yoldosh-timsohning-koz-yoshlari", a: "a-yoldosh", p: 232 },
  { t: "Timsohning ko'z yoshlari (qissa)", c: "abduqayum-yoldosh-timsohning-koz-yoshlari-qissa", a: "a-yoldosh", p: 208 },
  { t: "To'y (qissa)", c: "abduqayum-yoldosh-toy-qissa", a: "a-yoldosh", p: 160 },
  { t: "Yulduzning yo'li (qissa)", c: "abduqayum-yoldosh-yulduzning-yoli-qissa", a: "a-yoldosh", p: 192 },
  // ── Abdurahmon Karimov ──
  { t: "Qoro ko'zim", c: "abdurahmon-karimov-abduqayum-yoldosh-qaro-kozim", a: "a-abdurahmon", p: 240 },
  // ── Abdurashid Nurmurodov ──
  { t: "Nurafshon yog'du (roman)", c: "abdurashid-nurmurodov-nurafshon-yogdu-roman", a: "a-nurmurodov", p: 304 },
  // ── Abdurashid Pardayev ──
  { t: "Uch g'ildirakli velosiped (qissa va hikoyalar)", c: "abdurashid-pardayev-uch-gildirakli-velosiped-qissa-va-hikoyalar", a: "a-pardayev", p: 184 },
  // ── Abdusaid Ko'chimov ──
  { t: "Halqa", c: "abdusaid-kochimov-halqa", a: "a-kochimov", p: 176 },
  // ── Abdusattor Hotamov ──
  { t: "Yaxshilik daraxti (saylanma)", c: "abdusattor-hotamov-yaxshilik-daraxti-saylanma", a: "a-hotamov", p: 288 },
  // ── Abdusattor Sodiqov ──
  { t: "Oriyat (hikoyalar)", c: "abdusattor-sodiqov-oriyat-hikoyalar", a: "a-sodiqov", p: 208 },
  // ── Abulqosim Mamarasulov ──
  { t: "Alibek va qirq dostining sarguzashtlari (hikoyalar)", c: "abulqosim-mamarasulov-alibek-va-qirq-dostining-sarguzashtlari-hikoyalar", a: "a-mamarasulov", p: 240 },
  { t: "Barlos qishlog'ining oydin kechalari (hikoyalar)", c: "abulqosim-mamarasulov-barlos-qishlogining-oydin-kechalari-hikoyalar", a: "a-mamarasulov", p: 256 },
  { t: "Barlos qishlog'ining zumrad tonglari (hikoyalar)", c: "abulqosim-mamarasulov-barlos-qishlogining-zumrad-tonglari-hikoyalar", a: "a-mamarasulov", p: 264 },
  // ── Adham Damin ──
  { t: "Jur'at (hikoyalar)", c: "adham-damin-jurat-hikoyalar", a: "a-damin", p: 192 },
  { t: "Saylanma. 1-jild (roman va qissalar)", c: "adham-damin-saylanma-1-jild-roman-va-qissalar", a: "a-damin", p: 416 },
  // ── Afzal Tohirov ──
  { t: "Toshqin daryo (qissa)", c: "afzal-tohirov-toshqin-daryo-qissa", a: "a-tohirov", p: 176 },
  // ── Ahad Hasan ──
  { t: "Ko'hna Buxoro qissalari", c: "ahad-hasan-kohna-buxoro-qissalari", a: "a-ahad-hasan", p: 208 },
  // ── Ahmad A'zam ──
  { t: "Asqartog' tomonlarda (qissa)", c: "ahmad-azam-asqartog-tomonlarda-qissa", a: "a-azam", p: 208 },
  { t: "Bu kunning davomi (qissa)", c: "ahmad-azam-bu-kunning-davomi-qissa", a: "a-azam", p: 192 },
  { t: "Hali hayot bor (qissa)", c: "ahmad-azam-hali-hayot-bor-qissa", a: "a-azam", p: 224 },
  { t: "Odam zahri (kinoqissa)", c: "ahmad-azam-odam-zahri-kinoqissa", a: "a-azam", p: 160 },
  { t: "O'zi uylanmagan sovchi (roman)", c: "ahmad-azam-ozi-uylanmagan-sovchi-roman", a: "a-azam", p: 288 },
];

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

const BOOKS = UZ_BOOKS.map((b, i) => ({
  id: `book-uz-${String(i + 1).padStart(3, "0")}`,
  title: b.t,
  description: buildDescription(b.a, b.t),
  coverUrl: `/covers/${b.c}.svg`,
  language: "UZ",
  totalPages: b.p,
  authorId: b.a,
  categoryId: "cat-3", // O'zbek adabiyoti
  isPublished: true,
}));

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

const READING_PROGRESS = [];
const BOOKMARKS = [];
const FAVORITES = [];

// ── Boshlang'ich reytinglar: bosh sahifadagi "—" muammosini yechish uchun.
// ── Har bir asosiy kitobda kamida 2-3 baho bo'ladi, averages real ko'rinadi.
const RATING_USERS = ["user-1", "user-2", "user-3", "user-4", "user-5"];
const RATINGS = [];
BOOKS.slice(0, 30).forEach((b, i) => {
  for (let j = 0; j < 3; j++) {
    if ((i + j) % 4 === 3) continue; // har kitobda 2-3 baho
    RATINGS.push({
      userId: RATING_USERS[(i + j) % RATING_USERS.length],
      bookId: b.id,
      rating: 4 + ((i + j) % 2),
    });
  }
});

const SESSIONS_DATA = [];

const BANNERS = [
  { title: "Xush kelibsiz!", description: "MBSI Library — bilimga yo'l oching", imageUrl: "/covers/abdulla-qodiriy-otkan-kunlar-roman.svg", link: "/", order: 1, isActive: true },
  { title: "Yangi kitoblar", description: "Eng so'nggi kitoblar bilan tanishing", imageUrl: "/covers/abdulla-qahhor-sarob-roman.svg", link: "/books", order: 2, isActive: true },
  { title: "O'qishni boshlang", description: "3 ta kitobni bir vaqtda o'qishingiz mumkin", imageUrl: "/covers/abdulla-qodiriy-mehrobdan-chayon-roman.svg", link: "/books", order: 3, isActive: true },
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
