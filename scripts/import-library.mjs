#!/usr/bin/env node
// ============================================================
// MBSI Library — ko'p manbali kitob importi
//
// Manbalar:
//   1) ziyouz.com/kutubxona/barcha-kitoblar?showall=1  → 5200+ kitob (PDF)
//   2) handybook.uz/book-api                            → 22 kitob (PDF + muqova)
//
// Har bir kitob: PDF yuklanadi → saqlanadi (R2/S3 → disk → DB) →
// muallif va kategoriya yaratiladi → books jadvaliga yoziladi.
//
// Ishlatish:
//   node scripts/import-library.mjs                      # 599 ta, avtomatik
//   node scripts/import-library.mjs --target=200         # boshqa son
//   node scripts/import-library.mjs --sources=ziyouz     # faqat bitta manba
//   node scripts/import-library.mjs --dry-run            # yuklamasdan reja
//   node scripts/import-library.mjs --resume             # davom etish
//   node scripts/import-library.mjs --verify             # URL larni tekshirish
// ============================================================
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

// ─── Env ────────────────────────────────────────────────────
function loadEnv() {
  for (const f of [".env", ".env.local"]) {
    const p = path.join(process.cwd(), f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"'\r\n]*)"?\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  }
  // Neon pooler uzoq importlarda ulanishni tushirib yubormasligi uchun
  if (process.env.DATABASE_URL && !/pool_timeout=/.test(process.env.DATABASE_URL)) {
    const sep = process.env.DATABASE_URL.includes("?") ? "&" : "?";
    process.env.DATABASE_URL += `${sep}connection_limit=5&pool_timeout=60`;
  }
}
loadEnv();

const prisma = new PrismaClient();

const argv = process.argv.slice(2);
const arg = (name, def) => {
  const a = argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split("=").slice(1).join("=") : def;
};
const flag = (name) => argv.includes(`--${name}`);

const TARGET = Number(arg("target", "599"));
const SOURCES = arg("sources", "ziyouz,handybook").split(",").map((s) => s.trim());
const CONCURRENCY = Number(arg("concurrency", "6"));
const PROBE_CONCURRENCY = Number(arg("probe-concurrency", "8"));
// Ziyouz katta fayllarni sekin beradi — oraliq pauza kerak,
// aks holda ulanish uziladi ("fetch failed").
const PAUSE_MS = Number(arg("pause", "400"));
const PROBE_PAUSE_MS = Number(arg("probe-pause", "150"));
// Har bir so'rov uchun muddat. Uzoq qilib qo'ysa, bitta yopishgan
// fayl butun importni to'xtatib qo'yadi — qisqa + ko'p qayta urinish.
const DL_TIMEOUT = Number(arg("dl-timeout", "60000"));
const DL_TRIES = Number(arg("dl-tries", "3"));
const DRY_RUN = flag("dry-run");
const RESUME = flag("resume");
const VERIFY_ONLY = flag("verify");

const ROOT = process.cwd();
const CACHE_DIR = path.join(ROOT, "scripts", "cache");
const PDF_DIR = path.join(ROOT, "storage", "private", "pdfs");
const COVER_DIR = path.join(ROOT, "public", "covers");
const STATE_FILE = path.join(CACHE_DIR, "import-state.json");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Storage (R2/S3 → disk → DB) ─────────────────────────────
const s3Cfg = {
  bucket: process.env.S3_BUCKET || "",
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT || "",
  key: process.env.S3_ACCESS_KEY_ID || "",
  secret: process.env.S3_SECRET_ACCESS_KEY || "",
};
const S3_READY = Boolean(
  s3Cfg.bucket && s3Cfg.key && s3Cfg.secret && (s3Cfg.endpoint || s3Cfg.region)
);
const DRIVER = process.env.STORAGE_DRIVER || "auto";
const DRIVER_NAME = S3_READY && DRIVER !== "db" && DRIVER !== "local" ? "s3" : DRIVER === "local" ? "local" : "db";

let s3Client = null;
async function getS3() {
  if (s3Client) return s3Client;
  const { S3Client } = await import("@aws-sdk/client-s3");
  s3Client = new S3Client({
    region: s3Cfg.region || "auto",
    endpoint: s3Cfg.endpoint || undefined,
    forcePathStyle: true,
    credentials: { accessKeyId: s3Cfg.key, secretAccessKey: s3Cfg.secret },
  });
  return s3Client;
}

async function storePut(key, mime, buf) {
  if (DRIVER_NAME === "s3") {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await getS3();
    await client.send(
      new PutObjectCommand({ Bucket: s3Cfg.bucket, Key: key, Body: buf, ContentType: mime })
    );
    return key;
  }
  if (DRIVER_NAME === "local") {
    const full = path.join(ROOT, "storage", "private", key);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, buf);
    return key;
  }
  await prisma.storedFile.upsert({
    where: { key },
    update: { mime, size: buf.length, data: new Uint8Array(buf) },
    create: { key, mime, size: buf.length, data: new Uint8Array(buf) },
  });
  return key;
}

function storeHas(key) {
  if (DRIVER_NAME === "s3") return false;
  if (DRIVER_NAME === "local") return fs.existsSync(path.join(ROOT, "storage", "private", key));
  return false;
}

// ─── DB retry (Neon pooler) ──────────────────────────────────
async function dbRetry(fn, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      const code = e?.code || "";
      if (["P2024", "P1001", "P1017"].includes(code) && i < tries - 1) {
        await sleep(2500 * (i + 1));
        continue;
      }
      throw e;
    }
  }
}

// ─── HTTP ───────────────────────────────────────────────────
// "fetch failed" (uzilgan ulanish) va 5xx — vaqtincha muammo, qayta
// urinish bilan tuzaladi. 4xx (404) — bir marta yetarli.
const RETRYABLE = (e, res) => {
  const code = e?.cause?.code || e?.code || "";
  if (["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EPIPE", "UND_ERR_SOCKET", "UND_ERR_CONNECT_TIMEOUT"].includes(code))
    return true;
  if (e?.name === "TimeoutError" || e?.name === "AbortError") return true;
  if (res && res.status >= 500) return true;
  return false;
};

async function fetchRetry(url, opts = {}, tries = 4, timeoutMs = 120000) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        ...opts,
        headers: { "User-Agent": UA, Accept: "*/*", ...(opts.headers || {}) },
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (RETRYABLE(null, res) && i < tries - 1) {
        await sleep(2000 * (i + 1));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (!RETRYABLE(e) || i === tries - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }
  throw lastErr;
}

// ─── PDF tekshiruv ──────────────────────────────────────────
// Bet soni: PDF sahifalar ierarxiyasining ildizini (Pages, /Parent'siz)
// topamiz. Barcha `/Count` larni yig'ish xato — outline (/Outlines) va
// lug'atlar ham `/Count` ishlatadi.
function pdfPageCount(buf) {
  const s = buf.toString("latin1");
  // Ildiz sahifalar obyekti: /Type /Pages va /Parent yo'q
  let rootCount = 0;
  const objRe = /(\d+)\s+0\s+obj([\s\S]{0,2000}?)endobj/g;
  let m;
  while ((m = objRe.exec(s))) {
    const body = m[2];
    if (!/\/Type\s*\/Pages\b/.test(body)) continue;
    if (/\/Parent\b/.test(body)) continue;
    const c = body.match(/\/Count\s+(\d+)/);
    if (c) rootCount = Math.max(rootCount, Number(c[1]));
  }
  if (rootCount > 0) return rootCount;
  // Zaxira: obyektlar siqilgan bo'lsa /Type /Page hisobini ishlatamiz
  const t = s.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
  return t ? t.length : 0;
}

function isPdf(buf) {
  return buf.length > 1024 && buf.slice(0, 5).toString("latin1") === "%PDF-";
}

// ─── Kategoriya xaritasi ────────────────────────────────────
// ziyouz kategoriya slug'i → loyiha kategoriyasi
const ZIYOUZ_CAT = {
  "41-o-zbek-nasri": "cat-3",
  "39-o-zbek-mumtoz-adabiyoti": "cat-3",
  "40-alisher-navoiy-asarlari": "cat-3",
  "9-o-zbek-adabiy-tili": "cat-3",
  "38-o-zbek-xalq-og-zaki-ijodi": "cat-3",
  "7-o-zbek-zamonaviy-she-riyati": "cat-3",
  "8-o-zbek-dramaturgiyasi": "cat-3",
  "26-adabiy-antologiya-va-toplamlar": "cat-3",
  "29-eski-o-zbek-yozuvi": "cat-3",
  "28-adabiy-esdaliklar-xotiralar": "cat-3",
  "25-adabiyotshunoslik": "cat-2",
  "24-ilmiy-tarixiy-adabiy-maqolalar-risolalar": "cat-2",
  "27-adabiy-tarixiy-bukletlar": "cat-2",
  "36-hajviyot": "cat-2",
  "14-jahon-nasri": "cat-2",
  "16-jahon-dramaturgiyasi": "cat-9",
  "15-jahon-she-riyati": "cat-10",
  "13-sharq-mumtoz-adabiyoti": "cat-10",
  "12-jahon-xalqlari-og-zaki-ijodi": "cat-10",
  "17-bolalar-kutubxonasi": "cat-2",
  "114-bolalar-uchun-kitoblar": "cat-2",
  "20-axloq-odobga-oid-kitoblar": "cat-7",
  "21-hikmatlar-xazinasi-aforizmlar": "cat-7",
  "19-tasavvufga-oid-kitoblar": "cat-7",
  "18-islomiy-kitoblar": "cat-7",
  "36-xajviyot": "cat-7",
  "107-hadisi-sharif": "cat-7",
  "106-tafsir": "cat-7",
  "108-aqida-ilmlari": "cat-7",
  "109-fiqh": "cat-7",
  "110-fatvolar": "cat-7",
  "111-siyrat": "cat-7",
  "113-imom-g-azzoliy-kitoblari": "cat-7",
  "32-publitsistika": "cat-7",
  "117-jurnalistika": "cat-7",
  "118-falsafa": "cat-7",
  "22-tarixiy-kitoblar": "cat-8",
  "112-tarix": "cat-8",
  "11-o-zbekiston-milliy-ensiklopediyasi": "cat-8",
  "23-prezident-asarlari": "cat-8",
  "30-lug-atlar": "cat-1",
  "10-o-zbek-tilining-izohli-lug-ati": "cat-1",
  "31-chet-tillari": "cat-1",
  "120-tarjimashunoslik": "cat-1",
  "34-tibbiyotga-oid-risolalar": "cat-1",
  "37-turli-mavzulardagi-kitoblar": "cat-1",
  "127-hunarmadchilik": "cat-1",
  "132-statistika": "cat-1",
  "155-sport": "cat-1",
  "33-pazandalik": "cat-1",
  "133-uzbek-literature-in-english": "cat-6",
  "129-san-atshunoslik": "cat-6",
  "35-aniq-fanlar": "cat-1",
};

// "aniq fanlar" va "turli mavzular" ichida fan bo'yicha ajratish
const SUBJECT_RULES = [
  { cat: "cat-4", re: /\b(fizik|mexanik|elektr|magnet|optik|termodinamik|astro|fizika)\w*/iu },
  { cat: "cat-5", re: /\b(matematik|algebra|geometriya|trigonometr|analitik geometriya|arifmetik|hisob-kitob|olimpiad)\w*/iu },
  { cat: "cat-5", re: /\b(informatika|programirlash|dasturlash|algoritm)\w*/iu },
  { cat: "cat-6", re: /\b(ingliz|english|grammatika|vocabulary|ielts|toefl)\w*/iu },
  { cat: "cat-4", re: /\b(kimyo|biologiya|anatom|ekologiya|geologiya|botanika|zoologiya)\w*/iu },
];

function resolveCategory(slug, title) {
  const base = ZIYOUZ_CAT[slug] || "cat-2";
  if (slug === "35-aniq-fanlar" || slug === "37-turli-mavzulardagi-kitoblar") {
    for (const r of SUBJECT_RULES) if (r.re.test(title)) return r.cat;
  }
  return base;
}

// ─── Sifat bahosi (o'quvchi/o'qituvchi uchun moslik) ─────────
const MIN_SIZE = 120 * 1024;
const MAX_SIZE = 20 * 1024 * 1024;
// Kanonik to'plamlar (Xamsa, Boburnoma, "Asarlar. 10 tomlik") minglab
// betli — bular haqiqiy va qimmatli kitoblar, kesib tashlamaymiz.
const MAX_PAGES = 4000;
const MIN_PAGES = 5;

// Kategoriya bo'yicha maqsadli ulush (o'quvchi + o'qituvchi uchun)
const CAT_SHARE = {
  "cat-3": 0.24,
  "cat-2": 0.2,
  "cat-8": 0.14,
  "cat-7": 0.12,
  "cat-1": 0.1,
  "cat-9": 0.08,
  "cat-10": 0.06,
  "cat-6": 0.03,
  "cat-4": 0.015,
  "cat-5": 0.015,
};

const JUNK_RE = /(скачать|скачати|\\\\|\bhttp|\.pdf\b|\.zip\b|\.rar\b|torrent|объявлен|реклам)/iu;

// Qayta urinish natija bermaydigan xatolar
const PERMANENT = new Set(["katta", "kichik", "ko'p bet", "PDF emas", "tip=application/octet-stream"]);

function scoreBook(b) {
  let score = 0;
  const t = b.title.trim();
  if (JUNK_RE.test(t)) return -1;
  if (t.length < 10 || t.length > 160) return -1;

  // Nomi to'liq bo'lgan, muallif bilan kelgan asar — afzal
  if (/^.{3,60}\.\s+\S/.test(t)) score += 30;
  // Nashr yili ko'rsatilgan — kanonik nashr
  if (/\(\s*(1[89]|20)\d{2}\s*\)|\b(1[89]|20)\d{2}\b/.test(t)) score += 12;
  // Jild (ko'p jildli to'plam) — qiymatli
  if (/\b\d+\s*-?\s*jild|\b\d+\s*tom\b/i.test(t)) score += 8;
  // Noshirlik mashhuri
  if (/(o'?zbekiston|navoiy|qodiriy|toshmuhammad|fitrat|chunkiz|ibn sino|beruniy|ferganiy|mashhur|akademik|o'?quv qo'?llanma|darslik|o'?qituvchi uchun|o'?quvchi uchun|metodik|qollonma)/iu.test(t))
    score += 22;
  // Juda uzun "pochta ro'yxati" tipidagi nomlar
  if (t.length > 110) score -= 12;
  if (/[0-9]{4}\s*(-\s*[0-9]{4})?\s*$/u.test(t)) score -= 6;

  b._score = score;
  return score;
}

function extractAuthor(title, fallback) {
  // "Muallif. Asar nomi (yil)" yoki "Muallif, Asar nomi"
  const dot = title.match(/^(.{3,70}?)[.,]\s+(\S.{2,})$/);
  if (dot) return { author: dot[1].trim(), title: dot[2].trim() };
  return { author: fallback, title: title.trim() };
}

function normTitle(t) {
  return t
    .toLowerCase()
    .replace(/[\u2018\u2019'"`]/g, "")
    .replace(/[()\[\].,:;!?«»-]/g, " ")
    .replace(/\b(19|20)\d{2}\b/g, " ")
    .replace(/\d+\s*[-–]?\s*(jild|tom|kitob|qism| bet|sahifa)\b/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(input) {
  return (
    input
      .toLowerCase()
      .replace(/[\u2018\u2019'"`]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "kitob"
  );
}

// ─── Muqova (SVG) ───────────────────────────────────────────
const PALETTE = [
  ["#7c2d12", "#ea580c"], ["#1e3a8a", "#2563eb"], ["#14532d", "#16a34a"],
  ["#4c1d95", "#7c3aed"], ["#831843", "#db2777"], ["#134e4a", "#0d9488"],
  ["#713f12", "#ca8a04"], ["#312e81", "#4f46e5"], ["#7f1d1d", "#dc2626"],
  ["#0c4a6e", "#0284c7"], ["#3f6212", "#65a30d"], ["#701a75", "#a21caf"],
];
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function wrap(text, max) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max && line) { lines.push(line.trim()); line = w; }
    else line = line ? `${line} ${w}` : w;
  }
  if (line) lines.push(line.trim());
  return lines.slice(0, 4);
}

function coverSvg(title, author, catLabel) {
  const [c1, c2] = PALETTE[Math.abs([...title].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % PALETTE.length];
  const lines = wrap(title.toUpperCase(), 20);
  const startY = 250 - (lines.length - 1) * 20;
  const a = author.length > 34 ? author.slice(0, 34) + "…" : author;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560" role="img" aria-label="${esc(title)}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
<rect width="400" height="560" fill="url(#g)"/>
<circle cx="330" cy="80" r="95" fill="#fff" opacity="0.07"/>
<circle cx="70" cy="490" r="115" fill="#fff" opacity="0.06"/>
<rect width="12" height="560" fill="#000" opacity="0.22"/>
<text x="216" y="80" text-anchor="middle" fill="#fff" opacity="0.7" font-family="Segoe UI,system-ui,sans-serif" font-size="11" font-weight="600" letter-spacing="3">${esc(catLabel.toUpperCase().slice(0, 22))}</text>
${lines.map((l, i) => `<text x="216" y="${startY + i * 40}" text-anchor="middle" fill="#fff" font-family="Segoe UI,system-ui,sans-serif" font-size="26" font-weight="700">${esc(l)}</text>`).join("\n")}
<rect x="176" y="${startY + lines.length * 40 + 6}" width="80" height="2" fill="#fff" opacity="0.55"/>
<text x="216" y="${startY + lines.length * 40 + 40}" text-anchor="middle" fill="#fff" opacity="0.9" font-family="Segoe UI,system-ui,sans-serif" font-size="14">${esc(a)}</text>
<text x="216" y="520" text-anchor="middle" fill="#fff" opacity="0.45" font-family="Segoe UI,system-ui,sans-serif" font-size="9" font-weight="600" letter-spacing="3">MBSI KUTUBXONA</text>
</svg>`;
}

// ─── State (resume) ─────────────────────────────────────────
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")); } catch { return {}; }
}
function saveState(s) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 1));
}
// Har bir urinishda yoziladigan joriy holat — tashqi jarayon
// (monitor yoki admin panel) uni o'qib progressni ko'rsatadi.
function writeProgress(p) {
  try {
    fs.writeFileSync(
      path.join(CACHE_DIR, "import-progress.json"),
      JSON.stringify({ ...p, at: new Date().toISOString() }, null, 1)
    );
  } catch { /* kuzatish majburiy emas */ }
}

// ─── Manbalar ───────────────────────────────────────────────
async function discoverZiyouz() {
  const cache = path.join(CACHE_DIR, "ziyouz-index.json");
  if (fs.existsSync(cache) && !flag("refresh")) {
    const arr = JSON.parse(fs.readFileSync(cache, "utf-8"));
    console.log(`   ziyouz index (cache): ${arr.length} ta link`);
    return arr;
  }
  process.stdout.write("   ziyouz index yuklanmoqda... ");
  const res = await fetchRetry(
    "https://www.ziyouz.com/kutubxona/barcha-kitoblar?showall=1",
    {},
    3,
    120000
  );
  const html = await res.text();
  const re = /<a[^>]*?href="([^"]*download=(\d+):([^"]+))"[^>]*>([^<]+)<\/a>/gi;
  const seen = new Map();
  let m;
  while ((m = re.exec(html))) {
    const cat = m[1].match(/category\/([a-z0-9-]+)/i)?.[1] || "";
    if (!cat) continue;
    if (!seen.has(m[2]))
      seen.set(m[2], { source: "ziyouz", id: m[2], cat, title: decodeEntities(m[4].trim()), tslug: m[3] });
  }
  const arr = [...seen.values()];
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cache, JSON.stringify(arr, null, 1));
  console.log(`${arr.length} ta link`);
  return arr;
}

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, "")
    .trim();
}

async function discoverHandybook() {
  const cache = path.join(CACHE_DIR, "handybook-books.json");
  if (fs.existsSync(cache) && !flag("refresh")) {
    const arr = JSON.parse(fs.readFileSync(cache, "utf-8"));
    console.log(`   handybook (cache): ${arr.length} ta`);
    return arr.map(normalizeHandybook);
  }
  process.stdout.write("   handybook API... ");
  const map = new Map();
  const base = await fetchRetry("http://handybook.uz/book-api");
  for (const b of await base.json()) map.set(b.id, b);
  const cats = await (await fetchRetry("http://handybook.uz/book-api/all-category")).json();
  for (const c of cats) {
    try {
      const arr = await (
        await fetchRetry(
          `http://handybook.uz/book-api/category?name=${encodeURIComponent(c.type_name)}`
        )
      ).json();
      for (const b of arr || []) map.set(b.id, b);
    } catch { /* davom etamiz */ }
    await sleep(300);
  }
  const arr = [...map.values()];
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cache, JSON.stringify(arr, null, 2));
  console.log(`${arr.length} ta`);
  return arr.map(normalizeHandybook);
}

const HB_TYPE_TO_CAT = {
  1: "cat-2", 2: "cat-7", 4: "cat-2", 6: "cat-8", 7: "cat-2",
  3: "cat-7", 5: "cat-8", 8: "cat-1",
};
const HB_LANG = { uzbek: "UZ", "Ingliz tili": "EN", "Ingliz Tili": "EN", "Rus Tili": "RU", "Portugal Tili": "PT" };

function normalizeHandybook(hb) {
  return {
    source: "handybook",
    id: hb.id,
    title: String(hb.name || "").trim(),
    author: String(hb.author || "Noma'lum").trim(),
    description: String(hb.description || "")
      .replace(/\\r\\n|\\n/g, "\n")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffd]/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
    file: hb.file,
    image: hb.image,
    cat: HB_TYPE_TO_CAT[hb.type_id] || "cat-2",
    lang: HB_LANG[String(hb.lang || "").trim()] || "UZ",
    pages: Number(hb.count_page) || 0,
    year: hb.year,
    publisher: hb.publisher,
  };
}

// ─── Tanlash (saralash) ─────────────────────────────────────
async function selectCandidates() {
  const books = await dbRetry(() => prisma.book.findMany({ select: { title: true, slug: true } }));
  const seenSlug = new Set(books.map((b) => b.slug));
  const seenNorm = new Set(books.map((b) => normTitle(b.title)));

  const pool = [];
  for (const b of raw) {
    if (b.source === "ziyouz") {
      if (!b.title || b.title.length < 10) continue;
      const sc = scoreBook(b);
      if (sc < 0) continue;
      const { author, title } = extractAuthor(b.title, "Ziyouz kutubxonasi");
      const n = normTitle(title);
      if (!n || seenNorm.has(n)) continue;
      if (n.length < 8) continue;
      seenNorm.add(n);
      pool.push({
        ...b,
        title,
        author: author.length > 2 && author.length < 70 ? author : "Ziyouz kutubxonasi",
        categoryId: resolveCategory(b.cat, title),
        desc: `${title} — ziyouz.com milliy kutubxonasi nashri.`,
        pdfUrl: `https://www.ziyouz.com/kutubxona/category/${b.cat}?download=${b.id}:${encodeURIComponent(b.tslug)}`,
        lang: "UZ",
        pages: 0,
        score: sc,
      });
    } else {
      if (!b.title || !b.file) continue;
      const n = normTitle(b.title);
      if (seenNorm.has(n)) continue;
      seenNorm.add(n);
      pool.push({ ...b, desc: b.description || null, score: 100, categoryId: b.cat, pages: b.pages });
    }
  }

  // Kategoriya bo'yicha ulushga qarab saralash.
  // Nomzodlar to'plamining biroz kattaroq qismi olinadi, chunki
  // probe bosqichida bir qismi hajm/sabab bilan tashlab ketiladi.
  const byCat = {};
  for (const b of pool) (byCat[b.categoryId] ||= []).push(b);
  for (const k of Object.keys(byCat)) byCat[k].sort((a, b) => b.score - a.score);

  const OVERSCAN = Number(arg("overscan", "2.2"));
  const chosen = [];
  for (const [cat, share] of Object.entries(CAT_SHARE)) {
    const need = Math.round(TARGET * share * OVERSCAN);
    chosen.push(...(byCat[cat] || []).slice(0, need));
  }

  // Tanlanganlar yetmasa — qolganlardan to'ldiramiz
  if (chosen.length < TARGET * OVERSCAN) {
    const picked = new Set(chosen.map((b) => `${b.source}:${b.id}`));
    const rest = pool
      .filter((b) => !picked.has(`${b.source}:${b.id}`))
      .sort((a, b) => b.score - a.score);
    for (const b of rest) {
      if (chosen.length >= TARGET * OVERSCAN) break;
      chosen.push(b);
    }
  }
  void seenSlug;
  return { chosen, poolSize: pool.length };
}

// ─── Yuklab olish + saqlash ─────────────────────────────────
async function downloadPdf(cand) {
  if (cand.source === "handybook") return downloadHandybook(cand);
  return downloadZiyouz(cand);
}

async function downloadZiyouz(cand) {
  const max = cand.bytes ? MAX_SIZE + 1 : MAX_SIZE;
  const res = await fetchRetry(
    cand.pdfUrl,
    { headers: { Referer: "https://www.ziyouz.com/" } },
    DL_TRIES,
    DL_TIMEOUT
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const declared = Number(res.headers.get("content-length") || 0);
  if (declared && declared > max) throw new Error("katta");
  const buf = Buffer.from(await res.arrayBuffer());
  if (!isPdf(buf)) throw new Error(`PDF emas (${(res.headers.get("content-type") || "no-type")}, ${buf.length}b)`);
  return buf;
}

async function downloadHandybook(cand) {
  const res = await fetchRetry(cand.file, { headers: { Referer: "http://handybook.uz/" } }, DL_TRIES, DL_TIMEOUT);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!isPdf(buf)) throw new Error("PDF emas");
  return buf;
}

// ─── Probe bosqichi ─────────────────────────────────────────
// HEAD so'rovi orqali PDF hajmini aniqlaymiz — bu to'g'ridan-to'g'ri
// yuklashdan ancha tez, shuning uchun avval keraksiz (katta/buzilgan)
// fayllarni filtrlab tashlaymiz.
async function probeSize(cand) {
  if (cand.source !== "ziyouz") return null;
  try {
    const res = await fetch(cand.pdfUrl, {
      method: "HEAD",
      headers: { "User-Agent": UA, Referer: "https://www.ziyouz.com/" },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("pdf")) return { ok: false, reason: `tip=${ct || "?"}` };
    const bytes = Number(res.headers.get("content-length") || 0);
    if (!bytes) return { ok: false, reason: "hajm noma'lum" };
    if (bytes > MAX_SIZE) return { ok: false, reason: "katta", bytes };
    if (bytes < MIN_SIZE) return { ok: false, reason: "kichik", bytes };
    return { ok: true, bytes };
  } catch (e) {
    return { ok: false, reason: e.name === "TimeoutError" ? "timeout" : e.message };
  }
}

async function fetchCover(hb) {
  if (!hb?.image) return null;
  try {
    const res = await fetchRetry(hb.image, { headers: { Referer: "http://handybook.uz/" } }, 2, 30000);
    if (!res.ok) return null;
    const ext = (hb.image.match(/\.(png|jpe?g|webp)(\?|$)/i)?.[1] || "jpg").toLowerCase();
    const ext2 = ext === "jpeg" ? "jpg" : ext;
    const mime = ext2 === "png" ? "image/png" : ext2 === "webp" ? "image/webp" : "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500 || buf.length > 6 * 1024 * 1024) return null;
    return { buf, mime, ext: ext2 };
  } catch {
    return null;
  }
}

// ─── Umumiy import ──────────────────────────────────────────
let raw = [];
const counters = { ok: 0, skipDup: 0, tooBig: 0, tooSmall: 0, badPdf: 0, err: 0 };
// Mavjud slug'lar xotirada saqlanadi — har kitob uchun alohida
// `findUnique` so'rovi Neon'dan juda sekin (importni 3x sekinlashtiradi).
let usedSlugs = new Set();

async function importOne(cand, authorMap, catMap) {
  // Avval kalitni hisoblab, PDF diskda bormi-yo'qligini tekshiramiz —
  // oldingi urinishlarda yozilgan faylni qayta yuklab yubormaslik uchun
  // (yuzlab MB'siz qayta import).
  const base = slugify(cand.title).slice(0, 70);
  const key = `pdfs/${cand.source}-${cand.id}-${base.slice(0, 40)}.pdf`;
  const onDisk = DRIVER_NAME === "local" && storeHas(key);

  let buf;
  if (onDisk) {
    try {
      buf = await fs.promises.readFile(path.join(ROOT, "storage", "private", key));
    } catch {
      buf = null;
    }
  }
  if (!buf) {
    try {
      buf = await downloadPdf(cand);
    } catch (e) {
      counters.err++;
      return { ok: false, reason: e.message };
    }
    if (buf.length > MAX_SIZE) { counters.tooBig++; return { ok: false, reason: "katta" }; }
    if (buf.length < MIN_SIZE) { counters.tooSmall++; return { ok: false, reason: "kichik" }; }
  }
  if (buf.length > MAX_SIZE) { counters.tooBig++; return { ok: false, reason: "katta" }; }
  if (buf.length < MIN_SIZE) { counters.tooSmall++; return { ok: false, reason: "kichik" }; }

  const pages = pdfPageCount(buf) || cand.pages || Math.max(1, Math.round(buf.length / 3000));
  if (pages > MAX_PAGES) { counters.tooBig++; return { ok: false, reason: "ko'p bet" }; }
  if (pages < MIN_PAGES) { counters.tooSmall++; return { ok: false, reason: "kam bet" }; }

  // Unikal slug (xotira ichida tekshiramiz — DB so'rovi emas)
  let slug = base;
  let n = 1;
  while (usedSlugs.has(slug)) slug = `${base}-${++n}`;

  // Muallif
  const authorName = cand.author || "Noma'lum";
  let authorId = authorMap.get(authorName);
  if (!authorId) {
    const created = await dbRetry(() =>
      prisma.author.create({
        data: {
          name: authorName,
          biography:
            cand.source === "handybook"
              ? `${authorName} — handybook.uz kutubxonasi ma'lumotlari bo'yicha.`
              : `${authorName} — o'zbek adabiyotining namunaviy vakili.`,
        },
      })
    );
    authorId = created.id;
    authorMap.set(authorName, authorId);
  }

  // PDF saqlash (kalit yuqorida hisoblangan; diskda bo'lsa e'tiborsiz)
  if (!storeHas(key)) {
    if (!DRY_RUN) await storePut(key, "application/pdf", buf);
  }

  // Muqova
  let coverUrl = null;
  if (cand.source === "handybook") {
    const cov = await fetchCover(cand);
    if (cov) {
      const ckey = `covers/hb-${cand.id}.${cov.ext}`;
      if (!storeHas(ckey)) await storePut(ckey, cov.mime, cov.buf);
      coverUrl = `/api/files/${ckey}`;
    }
  }
  if (!coverUrl) {
    fs.mkdirSync(COVER_DIR, { recursive: true });
    const cfile = `${slug}.svg`;
    const cpath = path.join(COVER_DIR, cfile);
    if (!fs.existsSync(cpath)) {
      const catName = catMap.get(cand.categoryId) || "Kitob";
      fs.writeFileSync(cpath, coverSvg(cand.title, authorName, catName));
    }
    coverUrl = `/covers/${cfile}`;
  }

  if (DRY_RUN) {
    counters.ok++;
    return { ok: true, dry: true, title: cand.title, pages, mb: +(buf.length / 1048576).toFixed(2) };
  }

  await dbRetry(() =>
    prisma.book.create({
      data: {
        title: cand.title,
        slug,
        description: cand.desc || null,
        coverUrl,
        pdfUrl: key,
        language: cand.lang || "UZ",
        totalPages: pages,
        fileSize: buf.length,
        authorId,
        categoryId: cand.categoryId,
        isPublished: true,
        status: "ACTIVE",
      },
    })
  );
  usedSlugs.add(slug);
  counters.ok++;
  return { ok: true, title: cand.title, pages, mb: +(buf.length / 1048576).toFixed(2) };
}

async function runPool(items, worker, size, pauseMs = 0, shouldStop = null) {
  const results = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) {
        if (shouldStop && shouldStop()) return;
        const idx = i++;
        try {
          results[idx] = await worker(items[idx], idx);
        } catch (e) {
          counters.err++;
          results[idx] = { ok: false, reason: e.message };
          // Worker ichidagi xatolarni ham ko'ramiz - aks holda
          // (masalan storage xatosi) holat hech qayerda ko'rinmaydi.
          console.log(
            `   x ${idx + 1}/${items.length} ${items[idx].title?.slice(0, 45) || "?"} - ${e.message.split("\n").pop().slice(0, 160)}`
          );
        }
        // Kvota bilan cheklangan bandlar uchun pauza kerak emas.
        if (pauseMs && !results[idx]?.limited) await sleep(pauseMs);
      }
    })
  );
  return results;
}

// ─── Tekshiruv (verify) ─────────────────────────────────────
async function verify() {
  const books = await dbRetry(() =>
    prisma.book.findMany({
      select: { id: true, title: true, pdfUrl: true, totalPages: true, fileSize: true },
    })
  );
  console.log(`Tekshirilmoqda: ${books.length} ta kitob (${DRIVER_NAME} driver)\n`);
  let ok = 0, miss = 0;
  for (const b of books) {
    let present = false;
    if (DRIVER_NAME === "local") {
      present = fs.existsSync(path.join(ROOT, "storage", "private", b.pdfUrl));
    } else if (DRIVER_NAME === "s3") {
      present = true; // R2 da bor (upload logi bilan tasdiqlanadi)
    } else {
      present = Boolean(await prisma.storedFile.findUnique({ where: { key: b.pdfUrl } }));
    }
    if (present) ok++;
    else { miss++; console.log(`  YO'Q: ${b.title} (${b.pdfUrl})`); }
  }
  console.log(`\n  mavjud: ${ok}, yo'q: ${miss}`);
  return miss === 0;
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  console.log("=".repeat(60));
  console.log(`MBSI Library — kitob importi`);
  console.log(`  manba: ${SOURCES.join(", ")}`);
  console.log(`  maqsad: ${TARGET} ta | parallel: ${CONCURRENCY} | storage: ${DRIVER_NAME}`);
  if (DRY_RUN) console.log("  rejim: DRY-RUN (hech narsa yozilmaydi)");
  console.log("=".repeat(60) + "\n");

  if (VERIFY_ONLY) {
    const ok = await verify();
    process.exitCode = ok ? 0 : 1;
    return;
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.mkdirSync(PDF_DIR, { recursive: true });
  fs.mkdirSync(COVER_DIR, { recursive: true });

  // 1) Keshdan o'tgan importni hisobga olish
  const state = RESUME ? loadState() : {};
  const done = new Set(RESUME ? state.done || [] : []);
  // Doimiy xatolar (buzilgan PDF, noto'g'ri hajm) — qayta urinish
  // ma'nosiz, shuning uchun eslab qolamiz.
  const dead = new Set(RESUME ? state.dead || [] : []);

  // 2) Manbalarni kashf qilish
  console.log("1) Manbalar skanlanmoqda...");
  if (SOURCES.includes("ziyouz")) raw.push(...(await discoverZiyouz()));
  if (SOURCES.includes("handybook")) raw.push(...(await discoverHandybook()));
  console.log(`   jami topildi: ${raw.length}\n`);

  // 3) Tanlash
  console.log("2) Eng mos kitoblar saralanmoqda...");
  const { chosen, poolSize } = await selectCandidates();
  console.log(`   saralashdan o'tdi: ${poolSize}, tanlandi: ${chosen.length}\n`);

  const todo = chosen.filter(
    (b) => !done.has(`${b.source}:${b.id}`) && !dead.has(`${b.source}:${b.id}`)
  );
  console.log(`3) Yuklanmoqda: ${todo.length} ta (davomi: ${chosen.length - todo.length})\n`);

  // 4) Kategoriya nomlari (muqova uchun)
  const cats = await dbRetry(() => prisma.category.findMany({ select: { id: true, name: true } }));
  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  const authors = await dbRetry(() => prisma.author.findMany({ select: { id: true, name: true } }));
  const authorMap = new Map(authors.map((a) => [a.name, a.id]));
  usedSlugs = new Set(
    (await dbRetry(() => prisma.book.findMany({ select: { slug: true } }))).map((b) => b.slug)
  );

  // 5) Probe — content-length orqali og'irlikdan filtr
  const probeCachePath = path.join(CACHE_DIR, "ziyouz-probe.json");
  const probeCache = fs.existsSync(probeCachePath)
    ? JSON.parse(fs.readFileSync(probeCachePath, "utf-8"))
    : {};
  const needProbe = todo.filter((b) => probeCache[`${b.source}:${b.id}`] === undefined);
  console.log(`4) Hajm tekshiruvi (HEAD)... ${needProbe.length} ta tekshiriladi\n`);
  let probed = 0;
  const p0 = Date.now();
  await runPool(
    needProbe,
    async (cand) => {
      const id = `${cand.source}:${cand.id}`;
      const r = await probeSize(cand);
      probeCache[id] = r;
      probed++;
      if (probed % 100 === 0) {
        const rate = (probed / ((Date.now() - p0) / 1000)).toFixed(1);
        console.log(`   ... ${probed}/${needProbe.length} (${rate}/s)`);
        fs.writeFileSync(probeCachePath, JSON.stringify(probeCache, null, 0));
      }
      return r;
    },
    PROBE_CONCURRENCY,
    PROBE_PAUSE_MS
  );
  fs.writeFileSync(probeCachePath, JSON.stringify(probeCache, null, 0));
  const dropped = needProbe.length && Object.entries(probeCache).filter(([, v]) => v && !v.ok).length;
  console.log(`   tekshirildi: ${needProbe.length}, mos kelmadi (jami): ${dropped}\n`);

  // Faqat o'tganlarini import qilamiz
  const downloadable = todo
    .map((c) => {
      const p = probeCache[`${c.source}:${c.id}`];
      return p && p.ok ? { ...c, bytes: p.bytes } : c.source === "handybook" ? c : null;
    })
    .filter(Boolean);
  // Hajmi kichiklar avval — tez natija beradi, uzun ro'yxatning
  // oxirida sekin/katta fayllar qoladi.
  if (arg("order", "size") === "size")
    downloadable.sort((a, b) => (a.bytes || 0) - (b.bytes || 0));

  // ── Qattiq limit: DB'dagi jami kitob TARGET'dan oshmasligi kerak.
  // `--no-cap` bilan cheklov o'chiriladi (masalan, to'liq arxiv yuklash).
  const existingCount = DRY_RUN ? 0 : await dbRetry(() => prisma.book.count());
  const CAP = flag("no-cap") ? Infinity : Math.max(0, TARGET - existingCount);
  // Saralangan ro'yxatni ham kesamiz — ish bo'sh ketmasin.
  const planLimit = CAP === Infinity ? downloadable.length : Math.min(downloadable.length, CAP * 3);
  const toRun = downloadable.slice(0, planLimit);

  console.log(
    `5) Yuklanmoqda: ${toRun.length} ta` +
      (toRun.length < downloadable.length ? ` (rejadagi ${downloadable.length} dan kesildi)` : "") +
      `\n   DB'da allaqachon: ${existingCount} | TARGET: ${TARGET} | qolgan kvota: ${CAP}\n`
  );

  // 6) Import
  const t0 = Date.now();
  let doneCount = 0;
  let addedThisRun = 0;
  // Rezerv: parallel workerlar bir vaqtda chegaradan oshib ketmasligi
  // uchun slot oldindan ajratiladi; muvaffaqiyatsizlikda qaytariladi.
  let reserved = 0;
  const log = [];
  await runPool(
    toRun,
    async (cand) => {
      if (reserved >= CAP) {
        // Kvota to'ldi — xato emas, shunchaki ko'proq kerak emas.
        doneCount++;
        return { ok: false, limited: true, title: cand.title, pages: 0, mb: 0, reason: "kvota to'ldi" };
      }
      reserved++;
      let r;
      try {
        r = await importOne(cand, authorMap, catMap);
      } catch (e) {
        reserved--;
        throw e;
      }
      if (r.ok) addedThisRun++;
      else reserved--;
      doneCount++;

      const el = ((Date.now() - t0) / 1000).toFixed(0);
      const rate = (doneCount / Math.max(1, (Date.now() - t0) / 1000)).toFixed(2);
      if (r.limited) {
        // Kvota to'ldi — jim o'tkazamiz.
      } else if (r.ok) {
        const tag = r.dry ? "[dry]" : "+";
        console.log(
          `   ${tag} [${doneCount}/${toRun.length}] ${r.title.slice(0, 58)} — ${r.pages} bet, ${r.mb}MB (${rate}/s, ${el}s)`
        );
        if (!r.dry) {
          done.add(`${cand.source}:${cand.id}`);
          saveState({ done: [...done], dead: [...dead], updatedAt: new Date().toISOString() });
        }
        log.push(`${cand.source}: ${r.title} (${r.pages} bet, ${r.mb}MB)`);
      } else {
        console.log(`   ! [${doneCount}/${toRun.length}] ${cand.title.slice(0, 45)} — ${r.reason}`);
        log.push(`FAIL: ${cand.title} — ${r.reason}`);
        // Buzilgan/yaroqsiz fayl — qayta urinish natija bermaydi
        if (!r.dry && PERMANENT.has(r.reason)) {
          dead.add(`${cand.source}:${cand.id}`);
          saveState({ done: [...done], dead: [...dead], updatedAt: new Date().toISOString() });
        }
      }
      // Real-vaqt progress (tashqi kuzatish uchun)
      writeProgress({
        target: TARGET,
        attempted: doneCount,
        of: toRun.length,
        ok: counters.ok,
        failed:
          counters.err + counters.tooBig + counters.tooSmall + counters.badPdf,
        added: addedThisRun,
        remaining: CAP === Infinity ? null : Math.max(0, CAP - addedThisRun),
        elapsedSec: +el,
        ratePerSec: +rate,
        last: r.limited
          ? ""
          : (r.ok ? r.title : `${cand.title} — ${r.reason}`) || "",
      });
      if (doneCount % 10 === 0) {
        const total = await dbRetry(() => prisma.book.count());
        console.log(`   ... umumiy DB'da: ${total} ta kitob | xotirjamlik ${(process.memoryUsage().rss / 1048576).toFixed(0)}MB`);
      }
      return r;
    },
    CONCURRENCY,
    PAUSE_MS,
    () => reserved >= CAP
  );

  const total = await dbRetry(() => prisma.book.count());
  const byCat = await dbRetry(() =>
    prisma.book.groupBy({ by: ["categoryId"], _count: { _all: true } })
  );
  console.log(`\n${"=".repeat(60)}`);
  console.log(`YAKUN:`);
  console.log(`  yuklandi:        ${counters.ok}`);
  console.log(`  xato:            ${counters.err}`);
  console.log(`  PDF nosoz:       ${counters.badPdf}`);
  console.log(`  katta/kichik:    ${counters.tooBig}/${counters.tooSmall}`);
  console.log(`  DB'dagi jami:    ${total}`);
  console.log(`  vaqt:            ${((Date.now() - t0) / 60000).toFixed(1)} daqiqa`);
  console.log(`  storage:         ${DRIVER_NAME}`);
  console.log(`\nKategoriyalar bo'yicha:`);
  for (const c of byCat) console.log(`  ${c.categoryId}: ${c._count._all}`);
  console.log("=".repeat(60));

  fs.writeFileSync(
    path.join(CACHE_DIR, "import-library-report.json"),
    JSON.stringify({ at: new Date().toISOString(), counters, total, log }, null, 1)
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
