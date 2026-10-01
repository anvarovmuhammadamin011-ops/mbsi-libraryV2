import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

// Production'da PDF yetkazishni tekshirish:
// 1) login → session cookie
// 2) bir kitobning pdfUrl + bookId
// 3) signPdfAccess bilan imzolangan URL qurish (APP_SECRET kerak)
// 4) Production /api/pdf/[id]?expires&sig ga GET → 200 + "%PDF-" magic

const prisma = new PrismaClient();

const APP_SECRET = process.env.APP_SECRET;
if (!APP_SECRET) {
  console.error("APP_SECRET env'da yo'q");
  process.exit(1);
}

function signPdfAccess(bookId, expiresSec = 3600) {
  const expires = Math.floor(Date.now() / 1000) + expiresSec;
  const sig = crypto
    .createHmac("sha256", APP_SECRET)
    .update(`${bookId}:${expires}`)
    .digest("hex");
  return `/api/pdf/${bookId}?expires=${expires}&sig=${sig}`;
}

const BASE = process.env.PROD_BASE || "https://mbsi-library-v2.vercel.app";

const username = process.env.TEST_USER || "student";
const password = process.env.TEST_PASS || "demo123";

function cookieFromRes(res) {
  const setc = res.headers.get("set-cookie") || "";
  const m = setc.match(/([^;=]+)=([^;]*)/);
  return m ? `${m[1]}=${m[2]}` : "";
}

async function main() {
  console.log("BASE:", BASE);
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    redirect: "manual",
  });
  console.log("login status:", login.status);
  const cookie = cookieFromRes(login);
  console.log("cookie:", cookie ? cookie.split("=")[0] + "=***" : "NONE");

  if (!cookie) {
    const body = await login.text();
    console.log("login body:", body.slice(0, 300));
    process.exit(1);
  }

  const booksRes = await fetch(`${BASE}/api/books`, { headers: { Cookie: cookie } });
  console.log("books status:", booksRes.status);
  const booksJson = await booksRes.json();
  const books = Array.isArray(booksJson) ? booksJson : booksJson.books || booksJson.data || [];
  console.log("books count:", books.length);

  const book = books[0] || (await prisma.book.findFirst({ select: { id: true, title: true } }));
  console.log("testing book:", book.id, book.title);

  const url = `${BASE}${signPdfAccess(book.id)}`;
  const pdfRes = await fetch(url, { headers: { Cookie: cookie } });
  console.log("pdf status:", pdfRes.status, pdfRes.headers.get("content-type"));
  const buf = Buffer.from(await pdfRes.arrayBuffer());
  console.log("pdf bytes:", buf.length, "magic:", buf.slice(0, 5).toString("latin1"));
  const good = pdfRes.status === 200 && buf.slice(0, 5).toString("latin1") === "%PDF-";
  console.log(good ? "PDF OK: real file delivered" : "PDF FAIL");
}

main().finally(() => prisma.$disconnect());