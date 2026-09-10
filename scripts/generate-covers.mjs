// ============================================================
// MBSI Library — Book Cover Generator
// Regenerates public/covers/*.svg as professional, emoji-free
// typographic covers (400x533, 3:4) matching each seeded book.
// Run: node scripts/generate-covers.mjs
// ============================================================

import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "covers");

// ─── Design tokens ──────────────────────────────────────────
const PALETTES = [
  { a: "#1e3a8a", b: "#3b82f6", glow: "#93c5fd" }, // indigo / blue
  { a: "#7c2d12", b: "#ea580c", glow: "#fdba74" }, // burnt orange
  { a: "#14532d", b: "#22c55e", glow: "#86efac" }, // forest green
  { a: "#4c1d95", b: "#8b5cf6", glow: "#c4b5fd" }, // violet
  { a: "#831843", b: "#ec4899", glow: "#f9a8d4" }, // rose pink
  { a: "#134e4a", b: "#14b8a6", glow: "#5eead4" }, // teal
  { a: "#450a0a", b: "#dc2626", glow: "#fca5a5" }, // crimson
  { a: "#0f172a", b: "#475569", glow: "#94a3b8" }, // slate
  { a: "#713f12", b: "#d97706", glow: "#fcd34d" }, // amber
  { a: "#164e63", b: "#06b6d4", glow: "#67e8f9" }, // cyan
];

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Segoe UI', system-ui, -apple-system, sans-serif";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapTitle(title, maxChars) {
  const words = String(title).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= maxChars) cur = next;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}

// ─── Cover template ─────────────────────────────────────────
function makeCover({ title, author, category, paletteIndex, serif }) {
  const pal = PALETTES[paletteIndex % PALETTES.length];
  const lines = wrapTitle(title, 18);
  const fontSize = lines.length >= 3 ? 30 : lines.length === 2 ? 36 : 42;
  const lineGap = fontSize * 1.22;
  const titleTop = 225 - ((lines.length - 1) * lineGap) / 2;
  const dividerY = titleTop + lines.length * lineGap + 26;
  const authorY = dividerY + 34;
  const fontFam = serif ? SERIF : SANS;

  const titleLines = lines
    .map((ln, i) => {
      const y = titleTop + i * lineGap;
      return `<text x="210" y="${y}" text-anchor="middle" fill="#ffffff" font-family="${fontFam}" font-size="${fontSize}" font-weight="bold" letter-spacing="0.5">${esc(ln)}</text>`;
    })
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="533" viewBox="0 0 400 533" role="img" aria-label="${esc(title)}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${pal.a}"/>
      <stop offset="100%" style="stop-color:${pal.b}"/>
    </linearGradient>
    <radialGradient id="glow" cx="70%" cy="20%" r="80%">
      <stop offset="0%" style="stop-color:${pal.glow};stop-opacity:0.45"/>
      <stop offset="100%" style="stop-color:${pal.glow};stop-opacity:0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="400" height="533" fill="url(#bg)"/>
  <rect width="400" height="533" fill="url(#glow)"/>

  <!-- Decorative geometry -->
  <circle cx="330" cy="70" r="90" fill="#ffffff" opacity="0.06"/>
  <circle cx="60" cy="470" r="110" fill="#ffffff" opacity="0.05"/>
  <path d="M 20 90 L 380 60" stroke="#ffffff" stroke-width="1.5" opacity="0.14"/>
  <path d="M 20 470 L 380 440" stroke="#ffffff" stroke-width="1.5" opacity="0.14"/>
  <rect x="0" y="0" width="14" height="533" fill="#000000" opacity="0.18"/>
  <rect x="14" y="0" width="3" height="533" fill="#ffffff" opacity="0.12"/>

  <!-- Category eyebrow -->
  <text x="210" y="64" text-anchor="middle" fill="#ffffff" opacity="0.75" font-family="${SANS}" font-size="12" font-weight="600" letter-spacing="4">${esc(category.toUpperCase())}</text>

  <!-- Title -->
  ${titleLines}

  <!-- Divider -->
  <rect x="150" y="${dividerY}" width="100" height="2" rx="1" fill="#ffffff" opacity="0.55"/>

  <!-- Author -->
  <text x="210" y="${authorY}" text-anchor="middle" fill="#ffffff" opacity="0.9" font-family="${SANS}" font-size="15" font-weight="500" letter-spacing="1">${esc(author)}</text>

  <!-- Footer -->
  <text x="210" y="500" text-anchor="middle" fill="#ffffff" opacity="0.45" font-family="${SANS}" font-size="10" font-weight="600" letter-spacing="3">MBSI KUTUBXONA</text>
</svg>
`;
}

// ─── Book data (title, author, category, serif?) ────────────
const SERIF_CATS = ["Badiiy adabiyot", "O'zbek adabiyoti"];

const BOOKS = [
  ["ali-kitobi.svg", "Ali va uning sarguzashtlari", "Mehmon Baxtiyorov", "Badiiy adabiyot"],
  ["book-1.svg", "Atomic Habits", "James Clear", "Shaxsiy rivojlanish"],
  ["book-2.svg", "The Alchemist", "Paulo Coelho", "Badiiy adabiyot"],
  ["book-3.svg", "Deep Work", "James Clear", "Shaxsiy rivojlanish"],
  ["book-4.svg", "Thinking, Fast and Slow", "Stephen Hawking", "Ommabop ilm-fan"],
  ["book-5.svg", "Sapiens", "Stephen Hawking", "Tarix"],
  ["book-6.svg", "The Monk Who Sold His Ferrari", "Robin Sharma", "Shaxsiy rivojlanish"],
  ["book-7.svg", "How to Win Friends", "Dale Carnegie", "Shaxsiy rivojlanish"],
  ["book-8.svg", "Word Power Made Easy", "Norman Lewis", "Ingliz tili"],
  ["book-9.svg", "O'tkan Kunlar", "Abdulla Qodiriy", "O'zbek adabiyoti"],
  ["book-10.svg", "Jaynomad", "O'tkir Hoshimov", "O'zbek adabiyoti"],
  ["book-11.svg", "A Brief History of Time", "Stephen Hawking", "Ommabop ilm-fan"],
  ["book-12.svg", "Jur'a Tandir", "Chingiz Aytmatov", "O'zbek adabiyoti"],
  ["book-13.svg", "Mental Arithmetic", "Mehmon Baxtiyorov", "Matematika"],
  ["book-14.svg", "The Power of Now", "Robin Sharma", "Shaxsiy rivojlanish"],
  ["book-15.svg", "Rich Dad Poor Dad", "Paulo Coelho", "Shaxsiy rivojlanish"],
  ["book-16.svg", "The 48 Laws of Power", "Dale Carnegie", "Tarix"],
  ["book-17.svg", "Start with Why", "Robin Sharma", "Shaxsiy rivojlanish"],
  ["book-18.svg", "Zero to One", "James Clear", "Shaxsiy rivojlanish"],
  ["book-19.svg", "Good to Great", "James Clear", "Shaxsiy rivojlanish"],
  ["book-20.svg", "The Lean Startup", "James Clear", "Shaxsiy rivojlanish"],
  ["book-21.svg", "Thinking in Systems", "Stephen Hawking", "Ommabop ilm-fan"],
  ["book-22.svg", "The Art of War", "Dale Carnegie", "Tarix"],
  ["book-23.svg", "Meditations", "Paulo Coelho", "Tarix"],
  ["book-24.svg", "The Obstacle Is the Way", "Robin Sharma", "Shaxsiy rivojlanish"],
  ["book-25.svg", "Ego Is the Enemy", "Robin Sharma", "Shaxsiy rivojlanish"],
  ["book-26.svg", "Principles", "Ray Dalio", "Shaxsiy rivojlanish"],
  ["book-27.svg", "Can't Hurt Me", "David Goggins", "Shaxsiy rivojlanish"],
  ["book-28.svg", "The 5 AM Club", "Robin Sharma", "Shaxsiy rivojlanish"],
  ["book-29.svg", "Ikigai", "Héctor García", "Shaxsiy rivojlanish"],
  ["book-30.svg", "Atomic Habits (Uzbek)", "James Clear", "Shaxsiy rivojlanish"],
  ["book-31.svg", "O'zbekiston Tarixi", "Abdulla Qodiriy", "Tarix"],
  ["book-32.svg", "Matematika Asoslari", "Mehmon Baxtiyorov", "Matematika"],
  ["book-33.svg", "Fizika Qonunlari", "Stephen Hawking", "Fizika"],
  ["book-34.svg", "Ingliz Tili Grammatikasi", "Norman Lewis", "Ingliz tili"],
  ["book-35.svg", "Adabiyot Tanlangan", "O'tkir Hoshimov", "O'zbek adabiyoti"],
  ["book-36.svg", "Psixologiya Kirish", "Dale Carnegie", "Shaxsiy rivojlanish"],
  ["book-37.svg", "Biznes Asoslari", "Paulo Coelho", "Shaxsiy rivojlanish"],
  ["book-38.svg", "Falsafa Lug'at", "Paulo Coelho", "Tarix"],
  ["book-39.svg", "Sun'iy Intellekt", "James Clear", "Ommabop ilm-fan"],
  ["book-40.svg", "Iqlim O'zgarishi", "Stephen Hawking", "Ommabop ilm-fan"],
  ["book-41.svg", "Biologiya", "Mehmon Baxtiyorov", "Ommabop ilm-fan"],
  ["book-42.svg", "Kimyo Asoslari", "Mehmon Baxtiyorov", "Ommabop ilm-fan"],
  ["book-43.svg", "Geografiya", "Abdulla Qodiriy", "Ommabop ilm-fan"],
  ["book-44.svg", "Informatika", "James Clear", "Matematika"],
  ["book-45.svg", "Tarixiy Asarlar", "Chingiz Aytmatov", "Tarix"],
  ["book-46.svg", "Zamonaviy Adabiyot", "O'tkir Hoshimov", "Badiiy adabiyot"],
  ["book-47.svg", "Ilmiy Kashfiyotlar", "Stephen Hawking", "Ommabop ilm-fan"],
  ["book-48.svg", "Moliya Boshqaruvi", "James Clear", "Shaxsiy rivojlanish"],
  ["book-49.svg", "Muloqot San'ati", "Dale Carnegie", "Shaxsiy rivojlanish"],
  ["book-50.svg", "Hayot Falsafasi", "Paulo Coelho", "Shaxsiy rivojlanish"],
  // Banner hero covers referenced by the seed banners
  ["atomic-habits.svg", "Atomic Habits", "James Clear", "Shaxsiy rivojlanish"],
  ["alchemist.svg", "The Alchemist", "Paulo Coelho", "Badiiy adabiyot"],
  ["deep-work.svg", "Deep Work", "James Clear", "Shaxsiy rivojlanish"],
];

// ─── Write files ─────────────────────────────────────────────
fs.mkdirSync(OUT, { recursive: true });
let written = 0;
BOOKS.forEach(([file, title, author, category], i) => {
  const svg = makeCover({
    title,
    author,
    category,
    paletteIndex: i,
    serif: SERIF_CATS.includes(category),
  });
  fs.writeFileSync(path.join(OUT, file), svg, "utf8");
  written++;
});
console.log(`✅ Generated ${written} covers in public/covers/`);