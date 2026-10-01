#!/usr/bin/env node
// ============================================================
// Real kitoblar importi — 99 ta kitob, barchasida REAL PDF:
//   1) handybook.uz API  → 22 ta kitob (o'zbek/ingliz/fransuz/rus/portugal)
//   2) ziyouz.com        → 77 ta o'zbek tilidagi kitob (Phoca Download)
// PDF'lar `storage/private/pdfs/` ga yuklab olinadi.
// Muqovalar: handybook rasm URL yoki generatsiya qilingan SVG.
// Run: node scripts/import-real-books.mjs
// ============================================================
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

// .env ni yukla (DATABASE_URL)
if (!process.env.DATABASE_URL) {
  for (const f of [".env", ".env.local"]) {
    const p = path.join(process.cwd(), f);
    if (fs.existsSync(p)) {
      for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
        const m = line.match(/^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?\s*$/);
        if (m) {
          process.env.DATABASE_URL = m[1];
          break;
        }
      }
      if (process.env.DATABASE_URL) break;
    }
  }
}
// Uzoq skriptlarda Neon pooler ulanishlari qurib qolmasligi uchun
if (process.env.DATABASE_URL && !/pool_timeout=/.test(process.env.DATABASE_URL)) {
  const sep = process.env.DATABASE_URL.includes("?") ? "&" : "?";
  process.env.DATABASE_URL += `${sep}connection_limit=5&pool_timeout=60`;
}

const prisma = new PrismaClient();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Vaqtinchalik DB xatolarida (pool timeout va h.k.) qayta urinish
async function dbRetry(fn, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      const code = e?.code || "";
      if (["P2024", "P1001", "P1017"].includes(code) && i < tries - 1) {
        await sleep(3000 * (i + 1));
        continue;
      }
      throw e;
    }
  }
}

const ROOT = process.cwd();
const PDF_DIR = path.join(ROOT, "storage", "private", "pdfs");
const COVERS_DIR = path.join(ROOT, "public", "covers");
fs.mkdirSync(PDF_DIR, { recursive: true });
fs.mkdirSync(COVERS_DIR, { recursive: true });

const HANDYBOOK_API = "http://handybook.uz/book-api";
const ZIYOUZ = "https://ziyouz.com";
const TARGET = 99;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36 MBSI-Library/1.0";

// ─── Helpers ──────────────────────────────────────────────
const normTitle = (t) =>
  String(t).toLowerCase().replace(/\s+/g, " ").trim();

function loadJsonCache(file) {
  const p = path.join(ROOT, "scripts", "cache", file);
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}
function saveJsonCache(file, data) {
  const p = path.join(ROOT, "scripts", "cache", file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

async function fetchWithRetry(url, opts = {}, tries = 3, timeoutMs = 30000) {
  for (let i = 0; i < tries; i++) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        ...opts,
        signal: controller.signal,
        headers: {
          "User-Agent": UA,
          Referer: "https://www.ziyouz.com/",
          ...(opts.headers || {}),
        },
        redirect: "follow",
      });
      clearTimeout(t);
      return res;
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(1500 * (i + 1));
    }
  }
}

function slugify(input) {
  return (
    input
      .toLowerCase()
      .replace(/[''`']/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "kitob"
  );
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function colorFor(str) {
  const palette = [
    ["#7c2d12", "#ea580c"],
    ["#1e3a8a", "#2563eb"],
    ["#14532d", "#16a34a"],
    ["#4c1d95", "#7c3aed"],
    ["#831843", "#db2777"],
    ["#134e4a", "#0d9488"],
    ["#713f12", "#ca8a04"],
    ["#312e81", "#4f46e5"],
    ["#7f1d1d", "#dc2626"],
    ["#0c4a6e", "#0284c7"],
    ["#3f6212", "#65a30d"],
    ["#701a75", "#a21caf"],
  ];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function coverSvg(title, author, categoryLabel) {
  const t = title.length > 30 ? title.slice(0, 30) + "..." : title;
  const a = (author || "").length > 40 ? author.slice(0, 40) + "..." : author || "";
  const [c1, c2] = colorFor(title);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="533" viewBox="0 0 400 533" role="img" aria-label="${escapeXml(t)}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1}"/>
      <stop offset="100%" style="stop-color:${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="70%" cy="20%" r="80%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.22"/>
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="533" fill="url(#bg)"/>
  <rect width="400" height="533" fill="url(#glow)"/>
  <circle cx="330" cy="70" r="90" fill="#ffffff" opacity="0.07"/>
  <circle cx="60" cy="470" r="110" fill="#ffffff" opacity="0.06"/>
  <rect x="0" y="0" width="14" height="533" fill="#000000" opacity="0.2"/>
  <rect x="14" y="0" width="3" height="533" fill="#ffffff" opacity="0.12"/>
  <text x="210" y="70" text-anchor="middle" fill="#ffffff" opacity="0.75" font-family="'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="600" letter-spacing="3">${escapeXml((categoryLabel || "KUTUBXONA").toUpperCase().slice(0, 24))}</text>
  <text x="210" y="230" text-anchor="middle" fill="#ffffff" font-family="'Segoe UI', system-ui, sans-serif" font-size="30" font-weight="bold">${escapeXml(t)}</text>
  <rect x="150" y="300" width="100" height="2" rx="1" fill="#ffffff" opacity="0.55"/>
  <text x="210" y="335" text-anchor="middle" fill="#ffffff" opacity="0.9" font-family="'Segoe UI', system-ui, sans-serif" font-size="15">${escapeXml(a)}</text>
  <text x="210" y="500" text-anchor="middle" fill="#ffffff" opacity="0.45" font-family="'Segoe UI', system-ui, sans-serif" font-size="10" font-weight="600" letter-spacing="3">MBSI KUTUBXONA</text>
</svg>`;
}

// PDF sahifalarini hisoblash — /Type /Page obyektlarini sanaydi
function countPdfPages(buf) {
  const s = buf.toString("latin1");
  const m = s.match(/\/Type\s*\/\s*Page(?!s)/g);
  const n = m ? m.length : 0;
  return n > 0 ? n : 1;
}

function writeSvgCover(slug, title, author, catLabel) {
  const file = `${slug}.svg`;
  const p = path.join(COVERS_DIR, file);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, coverSvg(title, author, catLabel));
  }
  return `/covers/${file}`;
}

// ─── Kategoriya mapping ────────────────────────────────────
// handybook type_id → loyiha kategoriyasi
const HB_TYPE_TO_CAT = {
  1: "cat-2", // Badiiy adabiyot
  2: "cat-1", // Psixologiya → Ommabop ilm-fan
  4: "cat-2", // Bolalar adabiyoti → Badiiy adabiyot
  6: "cat-2", // Siyosat → Badiiy adabiyot
  7: "cat-2", // Detektiv va fantastika → Badiiy adabiyot
};
const HB_LANG = {
  uzbek: "UZ",
  "Ingliz tili": "EN",
  "Ingliz Tili": "EN",
  "Rus Tili": "RU",
  "Portugal Tili": "EN",
};

// ziyouz kategoriyalari (skrape qilinadigan)
const ZIYOUZ_CATEGORIES_TO_SCRAPE = [
  "41-o-zbek-nasri",
  "39-o-zbek-mumtoz-adabiyoti",
  "40-alisher-navoiy-asarlari",
  "38-o-zbek-xalq-og-zaki-ijodi",
  "12-jahon-xalqlari-og-zaki-ijodi",
  "14-jahon-nasri",
  "13-sharq-mumtoz-adabiyoti",
  "17-bolalar-kutubxonasi",
  "19-tasavvufga-oid-kitoblar",
  "7-o-zbek-zamonaviy-she-riyati",
  "16-jahon-dramaturgiyasi",
];

function ziyouzCatLabel(slug) {
  if (slug.startsWith("41")) return "O'zbek nasri";
  if (slug.startsWith("39")) return "Mumtoz adabiyot";
  if (slug.startsWith("40")) return "Alisher Navoiy";
  if (slug.startsWith("38")) return "Xalq ijodi";
  if (slug.startsWith("12")) return "Jahon og'zaki ijodi";
  if (slug.startsWith("14")) return "Jahon nasri";
  if (slug.startsWith("13")) return "Sharq adabiyoti";
  if (slug.startsWith("17")) return "Bolalar adabiyoti";
  if (slug.startsWith("19")) return "Tasavvuf";
  if (slug.startsWith("7")) return "She'riyat";
  if (slug.startsWith("16")) return "Dramaturgiya";
  return "Kitob";
}

function ziyouzCatToProjectCat(slug) {
  if (slug.startsWith("17")) return "cat-2"; // Bolalar → Badiiy adabiyot
  if (slug.startsWith("2")) return "cat-1"; // ilm-fan bo'lsa
  return "cat-2"; // qolganlari badiiy adabiyot
}

// ─── Main ──────────────────────────────────────────────────
async function main() {
  console.log("Real kitoblar importi boshlandi...\n");

  // ── DB'dagi mavjud kitoblar ──
  const existing = await dbRetry(() =>
    prisma.book.findMany({ select: { id: true, title: true, slug: true } })
  );
  const seenSlugs = new Set(existing.map((b) => b.slug));
  const seenTitles = new Set(existing.map((b) => normTitle(b.title)));

  async function uniqueSlug(base) {
    let slug = base;
    let n = 1;
    while (
      seenSlugs.has(slug) ||
      (await dbRetry(() => prisma.book.findUnique({ where: { slug } })))
    ) {
      n += 1;
      slug = `${base}-${n}`;
    }
    seenSlugs.add(slug);
    return slug;
  }

  // ── Mualliflar keshi ──
  const authors = await dbRetry(() => prisma.author.findMany({ select: { id: true, name: true } }));
  const authorMap = new Map(authors.map((a) => [a.name, a.id]));
  async function ensureAuthor(name, bio) {
    let id = authorMap.get(name);
    if (!id) {
      const created = await dbRetry(() => prisma.author.create({ data: { name, biography: bio } }));
      authorMap.set(name, created.id);
      id = created.id;
    }
    return id;
  }

  const results = { handybook: 0, ziyouz: 0, skipped: 0, pdfFail: 0 };
  const importedBooks = [];

  // ============ 1. HANDYBOOK.uz ============
  console.log("-- 1/2 handybook.uz API --");
  let hbBooks = loadJsonCache("handybook-books.json");
  if (!hbBooks) {
    const all = await (await fetchWithRetry(HANDYBOOK_API)).json();
    const map = new Map(all.map((b) => [b.id, b]));
    const cats = await (await fetchWithRetry(`${HANDYBOOK_API}/all-category`)).json();
    for (const c of cats) {
      try {
        const arr = await (
          await fetchWithRetry(`${HANDYBOOK_API}/category?name=${encodeURIComponent(c.type_name)}`)
        ).json();
        for (const b of arr || []) map.set(b.id, b);
      } catch {
        /* continue */
      }
      await sleep(300);
    }
    hbBooks = [...map.values()];
    saveJsonCache("handybook-books.json", hbBooks);
  }
  console.log(`   handybook: ${hbBooks.length} ta kitob topildi`);

  for (const hb of hbBooks) {
    try {
      if (!hb.file) {
        results.skipped++;
        continue;
      }
      const title = String(hb.name || "").trim().replace(/\s+/g, " ");
      const authorName = String(hb.author || "Noma'lum").trim();
      if (!title || seenTitles.has(normTitle(title))) {
        results.skipped++;
        continue;
      }
      seenTitles.add(normTitle(title));

      // PDF yuklab olish
      const pdfKey = `pdfs/hb-${hb.id}-${slugify(title).slice(0, 40)}.pdf`;
      const pdfPath = path.join(ROOT, "storage", "private", pdfKey);
      let fileSize = 0;
      if (!fs.existsSync(pdfPath)) {
        try {
          const res = await fetchWithRetry(
            hb.file,
            { headers: { Referer: "http://handybook.uz/" } },
            3,
            120000
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.slice(0, 5).toString("latin1") !== "%PDF-") throw new Error("PDF emas");
          fs.writeFileSync(pdfPath, buf);
          fileSize = buf.length;
        } catch (e) {
          console.log(`   ! PDF yuklab olinmadi (id=${hb.id}): ${e.message}`);
          results.pdfFail++;
          results.skipped++;
          continue;
        }
      } else {
        fileSize = fs.statSync(pdfPath).size;
      }

      // Muqova: handybook rasmini yuklab StoredFile (DB) ga saqlaymiz → /api/files/...
      // (CSP img-src 'self' cheklovi tufayli tashqi http rasmlar brauzerda ko'rinmaydi)
      let coverUrl = null;
      if (hb.image) {
        try {
          const ext = (hb.image.match(/\.(png|jpe?g|webp|gif)(\?|$)/i) || [])[1] || "jpg";
          const imgRes = await fetchWithRetry(hb.image, { headers: { Referer: "http://handybook.uz/" } }, 2);
          if (imgRes.ok) {
            const imgBuf = Buffer.from(await imgRes.arrayBuffer());
            if (imgBuf.length > 500 && imgBuf.length < 8 * 1024 * 1024) {
              const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg";
              const key = `covers/hb-${hb.id}.${ext === "jpeg" ? "jpg" : ext}`;
              await dbRetry(() =>
                prisma.storedFile.upsert({
                where: { key },
                update: { mime, size: imgBuf.length, data: new Uint8Array(imgBuf) },
                create: { key, mime, size: imgBuf.length, data: new Uint8Array(imgBuf) },
                })
              );
              coverUrl = `/api/files/${key}`;
            }
          }
        } catch {
          /* fallback below */
        }
      }
      if (!coverUrl) coverUrl = writeSvgCover(`hb-${hb.id}`, title, authorName, "Kitob");

      const catId = HB_TYPE_TO_CAT[hb.type_id] || "cat-2";
      const authorId = await ensureAuthor(
        authorName,
        `${authorName} — handybook.uz kutubxonasi ma'lumotlari bo'yicha.`
      );

      const slug = await uniqueSlug(slugify(title));
      const lang = HB_LANG[String(hb.lang || "").trim()] || "UZ";
      const totalPages =
        Number(hb.count_page) > 0 ? Number(hb.count_page) : countPdfPages(fs.readFileSync(pdfPath));

      const book = await dbRetry(() =>
        prisma.book.create({
          data: {
            title,
            slug,
            description: String(hb.description || "").trim() || null,
            coverUrl,
            pdfUrl: pdfKey,
            language: lang,
            totalPages,
            fileSize,
            authorId,
            categoryId: catId,
            isPublished: true,
            status: "ACTIVE",
          },
        })
      );
      results.handybook++;
      importedBooks.push(
        `hb: ${title} — ${authorName} (${Math.round(fileSize / 1024)}KB, ${totalPages} bet)`
      );
      console.log(`   + [${results.handybook + results.ziyouz}/${TARGET}] ${title}`);
    } catch (e) {
      console.log(`   ! handybook id=${hb.id} xato: ${e.message}`);
      results.skipped++;
    }
    await sleep(200);
  }
  console.log(`   OK handybook: ${results.handybook} ta kitob qo'shildi\n`);

  // ============ 2. ZIYOUZ.COM ============
  console.log("-- 2/2 ziyouz.com --");
  let allLinks = loadJsonCache("ziyouz-links.json");
  if (!allLinks) {
    allLinks = [];
    for (const catSlug of ZIYOUZ_CATEGORIES_TO_SCRAPE) {
      process.stdout.write(`   scraping ${catSlug}... `);
      try {
        const url = `${ZIYOUZ}/kutubxona/category/${catSlug}`;
        const html = await (await fetchWithRetry(url)).text();
        // <a class="" href="...?download=ID:slug" >Title</a> — atributlar href'dan oldin ham kelishi mumkin
        const re = /<a[^>]*?href="([^"]*download=(\d+):([^"]+))"[^>]*>([^<]+)<\/a>/gi;
        let m;
        let count = 0;
        while ((m = re.exec(html))) {
          const title = m[4].trim();
          if (title.length < 3) continue;
          allLinks.push({ catSlug, href: m[1], id: m[2], tslug: m[3], title });
          count++;
        }
        console.log(`${count} ta link`);
      } catch (e) {
        console.log(`xato: ${e.message}`);
      }
      await sleep(400);
    }
    saveJsonCache("ziyouz-links.json", allLinks);
  }
  console.log(`   ziyouz: ${allLinks.length} ta link yig'ildi`);

  // Dublikatlar (bir fayl bir necha kategoriyada) va mavjud kitoblarni o'tkazib yuborish
  const seenDl = new Set();
  const links = [];
  for (const l of allLinks) {
    if (seenDl.has(l.id)) continue;
    seenDl.add(l.id);
    if (!seenTitles.has(normTitle(l.title))) {
      links.push(l);
    }
  }
  console.log(`   ziyouz: ${links.length} ta unikal yangi kitob\n`);

  // Maqsad: DB'da jami TARGET ta kitob bo'lsin (cleanup'dan keyin qolgan real kitoblar + yangi import)
  const totalAfterHb = await dbRetry(() => prisma.book.count());
  const need = Math.max(0, TARGET - totalAfterHb);
  console.log(`   DB'da hozir ${totalAfterHb} ta kitob, yana ${need} ta kerak\n`);

  for (const l of links) {
    if (results.ziyouz >= need) break;
    try {
      const title = l.title;
      // "Muallif. Asar (yil)" formatidan muallifni ajratish
      let authorName = "Ziyouz kutubxonasi";
      const dotIdx = title.indexOf(". ");
      if (dotIdx > 2 && dotIdx < 60) {
        authorName = title.slice(0, dotIdx).trim();
      }

      // PDF yuklab olish (katta fayllar uchun uzoq timeout — 120s)
      const pdfKey = `pdfs/zy-${l.id}-${l.tslug.slice(0, 40)}.pdf`;
      const pdfPath = path.join(ROOT, "storage", "private", pdfKey);
      let fileSize = 0;
      if (!fs.existsSync(pdfPath)) {
        const url = `${ZIYOUZ}/kutubxona/category/${l.catSlug}?download=${l.id}:${l.tslug}`;
        const res = await fetchWithRetry(url, {}, 2, 120000);
        const ct = res.headers.get("content-type") || "";
        const buf = Buffer.from(await res.arrayBuffer());
        if (!res.ok || !ct.includes("pdf") || buf.slice(0, 5).toString("latin1") !== "%PDF-") {
          console.log(`   ! PDF bo'lmadi: ${title} (${ct || "no-type"}, ${buf.length}b)`);
          results.pdfFail++;
          continue;
        }
        fs.writeFileSync(pdfPath, buf);
        fileSize = buf.length;
      } else {
        fileSize = fs.statSync(pdfPath).size;
      }

      // Muqova SVG
      const slug = await uniqueSlug(slugify(title));
      const catLabel = ziyouzCatLabel(l.catSlug);
      const coverUrl = writeSvgCover(slug, title, authorName, catLabel);

      const catId = ziyouzCatToProjectCat(l.catSlug);
      const authorId = await ensureAuthor(authorName, `${authorName} — ziyouz.com kutubxonasi.`);

      const totalPages = countPdfPages(fs.readFileSync(pdfPath));

      const book = await dbRetry(() =>
        prisma.book.create({
          data: {
            title,
            slug,
            description: `${title} — ziyouz.com milliy kutubxonasi nashri.`,
            coverUrl,
            pdfUrl: pdfKey,
            language: "UZ",
            totalPages,
            fileSize,
            authorId,
            categoryId: catId,
            isPublished: true,
            status: "ACTIVE",
          },
        })
      );
      results.ziyouz++;
      importedBooks.push(`zy: ${title} (${Math.round(fileSize / 1024)}KB, ${totalPages} bet)`);
      console.log(
        `   + [${totalAfterHb + results.ziyouz}/${TARGET}] ${title} — ${Math.round(fileSize / 1024)}KB`
      );
    } catch (e) {
      console.log(`   ! ziyouz id=${l.id} xato: ${e.message}`);
    }
    await sleep(250);
  }

  // ── Yakuniy hisobot ──
  console.log(`\nNATIJA:`);
  console.log(`   handybook.uz:  ${results.handybook} ta`);
  console.log(`   ziyouz.com:    ${results.ziyouz} ta`);
  console.log(`   o'tkazib yuborildi: ${results.skipped} ta`);
  console.log(`   PDF yuklab olinmadi: ${results.pdfFail} ta`);
  const total = await dbRetry(() => prisma.book.count());
  console.log(`   DB'dagi jami kitoblar: ${total} (shu import: ${results.handybook + results.ziyouz})`);

  saveJsonCache("import-report.json", { results, importedBooks });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
