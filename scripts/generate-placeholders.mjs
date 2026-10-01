import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dirname, "..");

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function coverSvg(title, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="533" viewBox="0 0 400 533">
  <rect width="400" height="533" fill="${color}"/>
  <text x="200" y="220" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="28" font-weight="bold">${title.length > 20 ? title.slice(0, 20) + "…" : title}</text>
  <text x="200" y="280" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="system-ui,sans-serif" font-size="14">MBSI Library</text>
  <rect x="150" y="340" width="100" height="3" rx="1.5" fill="rgba(255,255,255,0.4)"/>
</svg>`;
}

function avatarSvg(initials, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="48" fill="${color}"/>
  <text x="48" y="56" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="32" font-weight="bold">${initials}</text>
</svg>`;
}

function iconSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#2563eb"/>
  <text x="${size/2}" y="${size*0.62}" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="${size*0.3}" font-weight="bold">M</text>
</svg>`;
}

// Book covers
const coversDir = join(ROOT, "public", "covers");
ensureDir(coversDir);

const books = [
  { file: "atomic-habits.svg", title: "Atomic Habits", color: "#3b82f6" },
  { file: "otkan-kunlar.svg", title: "O'tkan Kunlar", color: "#059669" },
  { file: "fizika-9.svg", title: "Fizika 9-sinf", color: "#dc2626" },
  { file: "jismoniy-tarbiya.svg", title: "Jismoniy Tarbiya", color: "#d97706" },
  { file: "brief-history.svg", title: "Brief History of Time", color: "#7c3aed" },
  { file: "monk-ferrari.svg", title: "Monk Who Sold Ferrari", color: "#0891b2" },
  { file: "win-friends.svg", title: "Win Friends", color: "#ca8a04" },
  { file: "word-power.svg", title: "Word Power", color: "#2563eb" },
  { file: "alchemist.svg", title: "The Alchemist", color: "#ea580c" },
  { file: "matematika-7.svg", title: "Matematika 7", color: "#4f46e5" },
  { file: "jannatda-qush.svg", title: "Jannatda Qush", color: "#0d9488" },
  { file: "dunyoning-ishlari.svg", title: "Dunyoning Ishlari", color: "#9333ea" },
  { file: "fizika-8.svg", title: "Fizika 8", color: "#dc2626" },
  { file: "matematika-9.svg", title: "Matematika 9", color: "#4f46e5" },
  { file: "ingliz-tili-5.svg", title: "Ingliz Tili", color: "#0369a1" },
  { file: "deep-work.svg", title: "Deep Work", color: "#1e293b" },
  { file: "ozbek-tarixi.svg", title: "O'zbek Tarixi", color: "#b45309" },
  { file: "think-grow-rich.svg", title: "Think & Grow Rich", color: "#065f46" },
  { file: "rus-tili-6.svg", title: "Rus Tili", color: "#1d4ed8" },
  { file: "biologiya-7.svg", title: "Biologiya", color: "#16a34a" },
];

for (const b of books) {
  writeFileSync(join(coversDir, b.file), coverSvg(b.title, b.color));
}
console.log(`Created ${books.length} book covers`);

// Avatars
const avatarsDir = join(ROOT, "public", "avatars");
ensureDir(avatarsDir);

const avatars = [
  { file: "student-1.svg", initials: "MT", color: "#3b82f6" },
  { file: "student-2.svg", initials: "AK", color: "#059669" },
  { file: "student-3.svg", initials: "SR", color: "#dc2626" },
  { file: "student-4.svg", initials: "NA", color: "#9333ea" },
  { file: "student-5.svg", initials: "JT", color: "#ea580c" },
  { file: "teacher-1.svg", initials: "DM", color: "#0891b2" },
  { file: "teacher-2.svg", initials: "GK", color: "#ca8a04" },
  { file: "admin-1.svg", initials: "AN", color: "#2563eb" },
];

for (const a of avatars) {
  writeFileSync(join(avatarsDir, a.file), avatarSvg(a.initials, a.color));
}
console.log(`Created ${avatars.length} avatars`);

// Icons
const iconsDir = join(ROOT, "public", "icons");
ensureDir(iconsDir);

writeFileSync(join(iconsDir, "icon-192.png"), ""); // placeholder
writeFileSync(join(iconsDir, "icon-512.png"), ""); // placeholder

// Generate SVG icon for favicon
writeFileSync(join(ROOT, "public", "icon.svg"), iconSvg(192));
console.log("Created icon placeholders");
console.log("Done!");
