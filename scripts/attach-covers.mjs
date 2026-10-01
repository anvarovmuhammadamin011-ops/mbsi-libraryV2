// Desktop/books dagi "* muqovasi.png" rasmlarni import qilingan kitoblarga biriktirish.
// Muqova DB (StoredFile) ga saqlanadi -> /api/files/... URL (Vercel da ham ishlaydi).
// Run: node scripts/attach-covers.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DIR = "C:\\Users\\Victus\\Desktop\\books";

function slugify(s) {
  return (
    s
      .toLowerCase()
      .replace(/['ʼ`’]/g, "")
      .replace(/[^a-z0-9\u0400-\u04ff\ufb00-\ufdff\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "kitob"
  );
}

const TITLES = {
  "%40KutubxonaaN1Jorj-Oruell-Molxona": "Hayvonlar xo'jaligi (Molxona)",
  "Andisha-va-gurur": "Andisha va g'urur",
  "Belyaev-Aleksandr.-Kets-yulduzi": "KETS yulduzi",
  "Bulgakov-It-yurak": "It yurak",
  "Kaykovus-Qobusnoma": "Qobusnoma",
  "Lutfiy-Gul-va-Navroz": "Gul va Navro'z",
  "Mark-Tven-Tom-Soyerning-yangi-sarguzashtlari-qissa": "Tom Soyerning yangi sarguzashtlari",
  "Mirach-Chagriy-Oqtosh-Tosiqlarga-qaramay-sevdik": "To'siqlarga qaramay sevdik",
  "Mirkarim-Osim-Zulmat-ichra-nur-qissa": "Zulmat ichra nur",
};

async function main() {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".png"));
  let ok = 0;
  for (const f of files) {
    const base = f.replace(/\.png$/i, "").replace(/\s+(muqovasi|miqovasi)$/i, "");
    const title = TITLES[base];
    if (!title) {
      console.log(`SKIP (kitob topilmadi): ${f}`);
      continue;
    }
    const slug = slugify(title);
    const book = await prisma.book.findUnique({ where: { slug } });
    if (!book) {
      console.log(`SKIP (bazada yo'q): ${title}`);
      continue;
    }
    const buf = fs.readFileSync(path.join(DIR, f));
    const key = `covers/${crypto.randomBytes(12).toString("hex")}.png`;
    await prisma.storedFile.create({
      data: { key, mime: "image/png", size: buf.length, data: new Uint8Array(buf) },
    });
    await prisma.book.update({
      where: { slug },
      data: { coverUrl: `/api/files/${key}` },
    });
    console.log(`OK: ${title} (${Math.round(buf.length / 1024)} KB)`);
    ok++;
  }
  console.log(`\nTayyor: ${ok}/${files.length} muqova biriktirildi.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
