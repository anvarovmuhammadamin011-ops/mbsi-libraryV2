// Fokuslangan probe: bitta kitobda reading API javoblarini kuzatish.
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const prisma = new PrismaClient();
const BASE = "http://localhost:3000";
const APP_SECRET = process.env.APP_SECRET || "mbsi-library-dev-secret-change-me";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const CDP_PORT = 9223;

const admin = await prisma.user.findFirst({ where: { role: "ADMIN", isActive: true } });
const book = await prisma.book.findFirst({ where: { slug: "alkimyogar" } });
const version = admin.sessionVersion ?? 0;
const sessSig = crypto.createHmac("sha256", APP_SECRET).update(`${admin.id}:${version}`).digest("hex");
const SESSION_COOKIE = `${admin.id}.v${version}.${sessSig}`;

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${CDP_PORT}`,
  "--headless=new", "--no-first-run", "--disable-gpu",
  "--user-data-dir=" + process.env.TEMP + "/mbsi-probe-" + Date.now(),
  "about:blank",
], { stdio: "ignore" });
process.on("exit", () => { try { chrome.kill(); } catch {} });

for (let i = 0; i < 40; i++) {
  try { const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`); if (r.ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 300));
}

const tabRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" });
const tab = await tabRes.json();

const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });

let mid = 0;
const pending = new Map();
const apiCalls = [];
const consoleMsgs = [];
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
  } else if (msg.method === "Network.responseReceived") {
    const url = msg.params.response.url;
    if (url.includes("/api/")) {
      apiCalls.push({ url: url.replace(BASE, ""), status: msg.params.response.status });
    }
  } else if (msg.method === "Runtime.consoleAPICalled") {
    const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ");
    if (text) consoleMsgs.push(text.slice(0, 200));
  } else if (msg.method === "Runtime.exceptionThrown") {
    consoleMsgs.push("EXCEPTION: " + (msg.params.exceptionDetails?.exception?.description || "").slice(0, 300));
  }
});
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const id = ++mid;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await send("Runtime.enable");
await send("Page.enable");
await send("Network.enable");

const csrfToken = "e2e-" + crypto.randomBytes(16).toString("hex");
await send("Network.setCookie", { name: "mbsi_session", value: SESSION_COOKIE, domain: "localhost", path: "/" });
await send("Network.setCookie", { name: "mbsi_csrf", value: csrfToken, domain: "localhost", path: "/" });

const loadDone = new Promise((res) => {
  const h = (e) => { const m = JSON.parse(e.data); if (m.method === "Page.loadEventFired") { ws.removeEventListener("message", h); res(); } };
  ws.addEventListener("message", h);
  setTimeout(res, 60000);
});
await send("Page.navigate", { url: `${BASE}/reader/${book.slug}` });
await loadDone;
await sleep(4000);

// document.cookie ni ko'rish (CSRF cookie JS uchun ko'rinadimi?)
const cookieRead = await send("Runtime.evaluate", { expression: "document.cookie", returnByValue: true });
console.log("📄 document.cookie:", cookieRead.result.value);

// Sahifani almashtirish
await send("Runtime.evaluate", { expression: `document.querySelector('[aria-label="Keyingi sahifa"]')?.click()` });
await sleep(2500);

console.log("\n🌐 API so'rovlar:");
apiCalls.forEach((c) => console.log(`  ${c.status} ${c.url}`));

console.log("\n💬 Console xabarlar:");
consoleMsgs.slice(0, 15).forEach((m) => console.log("  " + m));

// DB holati
const progress = await prisma.readingProgress.findUnique({
  where: { userId_bookId: { userId: admin.id, bookId: book.id } },
});
console.log("\n💾 DB progress:", progress ? `page=${progress.currentPage}` : "YO'Q");
const sessions = await prisma.readingSession.findMany({ where: { userId: admin.id, bookId: book.id } });
console.log("💾 DB sessions:", sessions.length);

ws.close();
await prisma.$disconnect();
process.exit(0);
