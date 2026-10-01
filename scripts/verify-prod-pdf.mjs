import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = "https://mbsi-library-v2.vercel.app";

// .env dan APP_SECRET o'qish
function loadEnvVar(name) {
  for (const f of [".env", ".env.local"]) {
    const p = path.join(process.cwd(), f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
      const m = line.match(new RegExp(`^\\s*${name}\\s*=\\s*"?([^"\\r\\n]+)"?\\s*$`));
      if (m) return m[1];
    }
  }
  return null;
}
const APP_SECRET = process.env.APP_SECRET || loadEnvVar("APP_SECRET");
if (!APP_SECRET) {
  console.error("APP_SECRET topilmadi");
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

function cookieFromRes(res) {
  const setc = res.headers.get("set-cookie") || "";
  const m = setc.match(/([^;=]+)=([^;]*)/);
  return m ? `${m[1]}=${m[2]}` : "";
}

async function main() {
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "student", password: "demo123" }),
    redirect: "manual",
  });
  const cookie = cookieFromRes(login);
  if (!cookie) {
    console.error("login failed", login.status, (await login.text()).slice(0, 200));
    return;
  }

  const books = await prisma.book.findMany({ select: { id: true, title: true } });
  console.log("books:", books.length);
  let okCount = 0;
  const results = [];
  for (const b of books) {
    try {
      const url = `${BASE}${signPdfAccess(b.id)}`;
      const res = await fetch(url, { headers: { Cookie: cookie } });
      const buf = Buffer.from(await res.arrayBuffer());
      const magic = buf.slice(0, 5).toString("latin1");
      const good = res.status === 200 && magic === "%PDF-";
      if (good) okCount++;
      results.push(`${good ? "OK " : "ERR"} ${b.title} | ${res.status} | ${buf.length}b | ${magic}`);
    } catch (e) {
      results.push(`ERR ${b.title} | ${String(e)}`);
    }
  }
  console.log(`\nPDF access OK: ${okCount}/${books.length}`);
  for (const r of results) console.log(r);
}

main().finally(() => prisma.$disconnect());