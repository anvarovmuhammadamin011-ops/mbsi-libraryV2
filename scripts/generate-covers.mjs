// Muqovasi yo'q import kitoblarga SVG muqova yasash (mavjud uslubda).
// Run: node scripts/generate-covers.mjs
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const COVERS_DIR = path.join(process.cwd(), "public", "covers");

const PALETTE = [
  ["#1e3a8a", "#3b82f6", "#bfdbfe"],
  ["#065f46", "#10b981", "#a7f3d0"],
  ["#7c2d12", "#ea580c", "#fdba74"],
  ["#831843", "#ec4899", "#fbcfe8"],
  ["#4c1d95", "#8b5cf6", "#ddd6fe"],
  ["#0c4a6e", "#06b6d4", "#a5f3fc"],
  ["#713f12", "#eab308", "#fde68a"],
  ["#7f1d1d", "#ef4444", "#fecaca"],
  ["#14532d", "#22c55e", "#bbf7d0"],
  ["#1e1b4b", "#6366f1", "#c7d2fe"],
  ["#500724", "#f43f5e", "#fecdd3"],
  ["#042f2e", "#14b8a6", "#99f6e4"],
  ["#3b0764", "#a855f7", "#e9d5ff"],
  ["#431407", "#f97316", "#fed7aa"],
  ["#082f49", "#0ea5e9", "#bae6fd"],
];

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrapTitle(title, maxChars = 13) {
  const words = title.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars && cur) {
      lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}

function coverSvg(title, author, category, colors) {
  const [dark, main, glow] = colors;
  const lines = wrapTitle(title);
  const fontSize = lines.some((l) => l.length > 11) ? 34 : 40;
  const lineH = fontSize + 8;
  const startY = 225 - ((lines.length - 1) * lineH) / 2;
  const titleEls = lines
    .map(
      (l, i) =>
        `  <text x="210" y="${startY + i * lineH}" text-anchor="middle" fill="#ffffff" font-family="'Segoe UI', system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="bold" letter-spacing="0.5">${esc(l)}</text>`
    )
    .join("\n");
  const dividerY = startY + (lines.length - 1) * lineH + 34;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="533" viewBox="0 0 400 533" role="img" aria-label="${esc(title)}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${dark}"/>
      <stop offset="100%" style="stop-color:${main}"/>
    </linearGradient>
    <radialGradient id="glow" cx="70%" cy="20%" r="80%">
      <stop offset="0%" style="stop-color:${glow};stop-opacity:0.45"/>
      <stop offset="100%" style="stop-color:${glow};stop-opacity:0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="533" fill="url(#bg)"/>
  <rect width="400" height="533" fill="url(#glow)"/>
  <circle cx="330" cy="70" r="90" fill="#ffffff" opacity="0.06"/>
  <circle cx="60" cy="470" r="110" fill="#ffffff" opacity="0.05"/>
  <path d="M 20 90 L 380 60" stroke="#ffffff" stroke-width="1.5" opacity="0.14"/>
  <path d="M 20 470 L 380 440" stroke="#ffffff" stroke-width="1.5" opacity="0.14"/>
  <rect x="0" y="0" width="14" height="533" fill="#000000" opacity="0.18"/>
  <rect x="14" y="0" width="3" height="533" fill="#ffffff" opacity="0.12"/>
  <text x="210" y="64" text-anchor="middle" fill="#ffffff" opacity="0.75" font-family="'Segoe UI', system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" letter-spacing="4">${esc(category.toUpperCase())}</text>
${titleEls}
  <rect x="150" y="${dividerY}" width="100" height="2" rx="1" fill="#ffffff" opacity="0.55"/>
  <text x="210" y="${dividerY + 34}" text-anchor="middle" fill="#ffffff" opacity="0.9" font-family="'Segoe UI', system-ui, -apple-system, sans-serif" font-size="15" font-weight="500" letter-spacing="1">${esc(author)}</text>
  <text x="210" y="500" text-anchor="middle" fill="#ffffff" opacity="0.45" font-family="'Segoe UI', system-ui, -apple-system, sans-serif" font-size="10" font-weight="600" letter-spacing="3">MBSI KUTUBXONA</text>
</svg>
`;
}

async function main() {
  fs.mkdirSync(COVERS_DIR, { recursive: true });
  const books = await prisma.book.findMany({
    where: { id: { startsWith: "book-imp-" }, coverUrl: null },
    include: { author: true, category: true },
    orderBy: { title: "asc" },
  });
  console.log(`Muqovasiz: ${books.length} ta`);
  let i = 0;
  for (const b of books) {
    const svg = coverSvg(
      b.title,
      b.author?.name ?? "Noma'lum",
      b.category?.name ?? "Kitob",
      PALETTE[i % PALETTE.length]
    );
    const filename = `${b.slug}.svg`;
    fs.writeFileSync(path.join(COVERS_DIR, filename), svg, "utf8");
    await prisma.book.update({
      where: { id: b.id },
      data: { coverUrl: `/covers/${filename}` },
    });
    console.log(`OK: ${b.title}`);
    i++;
  }
  console.log(`\nTayyor: ${i} ta muqova yaratildi.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
