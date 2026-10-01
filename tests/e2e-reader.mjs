// E2E: Reader oqimini headless Chrome (CDP) orqali tekshirish.
// Ishga tushirish: node tests/e2e-reader.mjs   (dev server localhost:3000 da ishlayotgan bo'lsin)
// Node 24+: global WebSocket mavjud (ws paketi kerak emas)
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const prisma = new PrismaClient();

// ─── Config ────────────────────────────────────────────────
const BASE = "http://localhost:3000";
const APP_SECRET = process.env.APP_SECRET || "mbsi-library-dev-secret-change-me";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const CDP_PORT = 9222;

// ─── DB ma'lumotlar ────────────────────────────────────────
const books = await prisma.book.findMany({
  where: { slug: { in: ["alkimyogar", "jimjitlik", "uch-ogayni-botirlar"] } },
  select: { id: true, slug: true, title: true, totalPages: true },
  orderBy: { slug: "asc" },
});
const admin = await prisma.user.findFirst({
  where: { role: "ADMIN", isActive: true },
  select: { id: true, name: true },
});
if (books.length < 3 || !admin) {
  console.error("❌ Test kitoblari yoki admin topilmadi");
  process.exit(1);
}
console.log(`👤 Foydalanuvchi: ${admin.name} (${admin.id})`);
books.forEach((b) => console.log(`📖 ${b.title} (${b.totalPages} sahifa)`));

// ─── Session cookie (auth.ts bilan bir xil HMAC format) ────
const version = 0;
const sessSig = crypto.createHmac("sha256", APP_SECRET).update(`${admin.id}:${version}`).digest("hex");
const SESSION_COOKIE = `${admin.id}.v${version}.${sessSig}`;

// ─── Chrome'ni ishga tushirish ─────────────────────────────
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${CDP_PORT}`,
  "--headless=new",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-gpu",
  "--user-data-dir=" + process.env.TEMP + "/mbsi-e2e-profile-" + Date.now(),
  "about:blank",
], { stdio: "ignore" });
const cleanupChrome = () => { try { chrome.kill(); } catch {} };
process.on("exit", cleanupChrome);

// CDP ga ulanishni kutish
async function waitForCdp(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("Chrome CDP ga ulanolmadi");
}
await waitForCdp();
console.log("🌐 Chrome headless ishga tushdi (CDP: 9222)");

// ─── CDP yordamchi funksiyalar ─────────────────────────────
async function createTab(url) {
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
  const tab = await res.json();
  return tab;
}

function connectWs(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    const events = [];
    const waiters = [];
    ws.addEventListener("open", () => resolve({
      send: (method, params = {}) =>
        new Promise((res2, rej2) => {
          const mid = ++id;
          pending.set(mid, { res2, rej2 });
          ws.send(JSON.stringify({ id: mid, method, params }));
        }),
      waitEvent: (predicate, timeoutMs = 15000) =>
        new Promise((res2, rej2) => {
          const idx = events.findIndex(predicate);
          if (idx >= 0) return res2(events.splice(idx, 1)[0]);
          waiters.push({ predicate, res2 });
          setTimeout(() => rej2(new Error("waitEvent timeout")), timeoutMs);
        }),
      close: () => ws.close(),
    }));
    ws.addEventListener("message", (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) {
        const { res2, rej2 } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej2(new Error(msg.error.message)) : res2(msg.result);
      } else if (msg.method) {
        events.push(msg);
        for (let i = waiters.length - 1; i >= 0; i--) {
          if (waiters[i].predicate(msg)) {
            waiters[i].res2(msg);
            waiters.splice(i, 1);
          }
        }
      }
    });
    ws.addEventListener("error", reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Yakuniy natijalar ─────────────────────────────────────
const results = [];
let hasFailure = false;

function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!ok) hasFailure = true;
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

// ─── Har bir kitob uchun test ──────────────────────────────
for (const book of books) {
  console.log(`\n═══ ${book.title} ═══`);

  // Testdan oldingi holat
  const progressBefore = await prisma.readingProgress.findUnique({
    where: { userId_bookId: { userId: admin.id, bookId: book.id } },
  });

  const tab = await createTab("about:blank");
  await sleep(500);
  const cdp = await connectWs(tab.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  const errors = [];
  cdp.waitEvent((m) => m.method === "Runtime.exceptionThrown", 60000)
    .then((m) => errors.push(m.params?.exceptionDetails?.exception?.description || "exception"))
    .catch(() => {});

  // Cookie qo'yish (session + CSRF double-submit)
  // Middleware: mutation so'rovda x-csrf-token headeri mbsi_csrf cookie bilan
  // bir xil bo'lishi shart. Real ilovada bu cookie login'da beriladi va
  // api-client uni headerda qaytaradi. Testda xuddi shu oqimni yaratamiz.
  const csrfToken = "e2e-" + crypto.randomBytes(16).toString("hex");
  await cdp.send("Network.enable");
  await cdp.send("Network.setCookie", {
    name: "mbsi_session",
    value: SESSION_COOKIE,
    domain: "localhost",
    path: "/",
  });
  await cdp.send("Network.setCookie", {
    name: "mbsi_csrf",
    value: csrfToken,
    domain: "localhost",
    path: "/",
  });

  // Reader sahifasini ochish
  const loadDone = cdp
    .waitEvent((m) => m.method === "Page.loadEventFired", 90000)
    .catch(() => null);
  await cdp.send("Page.navigate", { url: `${BASE}/reader/${book.slug}` });
  await loadDone;

  // Sahifa kompilyatsiya/render bo'lishini kutish: canvas ko'rinadi + footer "Sahifa"
  const evalJs = async (expr, awaitPromise = false) => {
    const r = await cdp.send("Runtime.evaluate", { expression: expr, awaitPromise, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || "JS xato");
    return r.result?.value;
  };

  let canvasOk = false;
  for (let i = 0; i < 40; i++) {
    canvasOk = await evalJs(`(() => {
      const c = document.querySelector("canvas");
      if (!c || c.style.display === "none") return false;
      return c.width > 100 && c.height > 100;
    })()`).catch(() => false);
    if (canvasOk) break;
    await sleep(500);
  }
  check(`${book.title}: reader sahifasi ochildi, canvas render bo'ldi`, canvasOk);

  // PDF mazmuni tekshiruvi: canvas bo'sh emasmi (pixel sampling)
  if (canvasOk) {
    const isBlank = await evalJs(`(() => {
      const c = document.querySelector("canvas");
      const ctx = c.getContext("2d");
      const d = ctx.getImageData(0, 0, c.width, Math.min(c.height, 400)).data;
      for (let i = 3; i < d.length; i += 400) { if (d[i] !== 0 || d[i-1] !== 255) return false; }
      return true;
    })()`).catch(() => true);
    check(`${book.title}: canvas'da PDF mazmuni chizilgan (bo'sh emas)`, !isBlank);
  }

  // Footer sahifa indikatori
  const pageInfo0 = await evalJs(`document.querySelector("footer span")?.textContent || ""`);
  check(`${book.title}: sahifa indikatori ko'rinadi`, /Sahifa\s+\d+\s*\/\s*\d+/.test(pageInfo0), pageInfo0.trim());

  // ─── 3 sahifa oldinga ───
  for (let i = 0; i < 3; i++) {
    await evalJs(`document.querySelector('[aria-label="Keyingi sahifa"]')?.click()`);
    await sleep(900);
  }
  await sleep(1500); // debounced progress saqlash (800ms)

  const pageInfo1 = await evalJs(`document.querySelector("footer span")?.textContent || ""`);
  const pageNum = parseInt((pageInfo1.match(/Sahifa\s+(\d+)/) || [])[1] || "0", 10);
  check(`${book.title}: sahifa oldinga o'tdi`, pageNum === 4, `"${pageInfo1.trim()}" (kutilgan: 4)`);

  // Canvas yangi sahifada ham chizilganini tekshirish
  const stillRendered = await evalJs(`(() => {
    const c = document.querySelector("canvas");
    return c && c.width > 100 && c.height > 100;
  })()`).catch(() => false);
  check(`${book.title}: yangi sahifa ham chizildi`, stillRendered);

  // ─── Orqaga (prev) ───
  await evalJs(`document.querySelector('[aria-label="Oldingi sahifa"]')?.click()`);
  await sleep(900);
  const pageInfo2 = await evalJs(`document.querySelector("footer span")?.textContent || ""`);
  check(`${book.title}: orqaga qaytish ishlaydi`, /Sahifa\s+3\b/.test(pageInfo2), pageInfo2.trim());

  // ─── Session yakunlanishi uchun sahifadan chiqish (unmount → session/end) ───
  await cdp.send("Page.navigate", { url: `${BASE}/books` });
  await sleep(2500); // unmount + session/end POST uchun

  await cdp.close();
  await sleep(300);

  // ─── DB tekshiruvlari ───
  const progressAfter = await prisma.readingProgress.findUnique({
    where: { userId_bookId: { userId: admin.id, bookId: book.id } },
  });
  check(
    `${book.title}: ReadingProgress DB'ga saqlandi`,
    !!progressAfter && progressAfter.currentPage === 3,
    progressAfter ? `currentPage=${progressAfter.currentPage}, progress=${progressAfter.progress.toFixed(1)}%` : "yozuv yo'q"
  );

  const sessions = await prisma.readingSession.findMany({
    where: { userId: admin.id, bookId: book.id },
    orderBy: { startedAt: "desc" },
    take: 3,
  });
  const endedSession = sessions.find((s) => s.endedAt !== null);
  check(
    `${book.title}: ReadingSession yaratildi va yakunlandi`,
    sessions.length > 0 && !!endedSession && endedSession.endPage === 3,
    sessions.length
      ? `sessions=${sessions.length}, endPage=${endedSession?.endPage}, pagesRead=${endedSession?.pagesRead}`
      : "sessiya yo'q"
  );
}

// ─── Xulosalar ─────────────────────────────────────────────
console.log("\n════════════════════════════════");
const passed = results.filter((r) => r.ok).length;
console.log(`NATIJA: ${passed}/${results.length} tekshiruv o'tdi`);
if (hasFailure) {
  console.log("Xatoliklar bilan yakunlandi");
  await prisma.$disconnect();
  process.exit(1);
} else {
  console.log("Barcha tekshiruvlar muvaffaqiyatli ✅");
}
await prisma.$disconnect();
cleanupChrome();
process.exit(0);
