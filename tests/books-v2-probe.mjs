// /api/books-v2 probe â€” dev server (npm run dev) ishlayotgan bo'lishi shart.
// nodm: node tests/books-v2-probe.mjs
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const prisma = new PrismaClient();

function readEnvFile(name) {
  try {
    const out = {};
    for (const line of fs.readFileSync(name, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
    return out;
  } catch {
    return {};
  }
}

const fileEnv = { ...readEnvFile(".env.local"), ...readEnvFile(".env") };
const APP_SECRET =
  process.env.APP_SECRET || fileEnv.APP_SECRET || "mbsi-library-dev-secret-change-me";

function sessionCookie(user) {
  const version = user.sessionVersion ?? 0;
  const sig = crypto
    .createHmac("sha256", APP_SECRET)
    .update(`${user.id}:${version}`)
    .digest("hex");
  return `${user.id}.v${version}.${sig}`;
}

function csrfToken(session) {
  const payload = `${session}:${Date.now()}`;
  const sig = crypto
    .createHmac("sha256", "mbsi-csrf-" + APP_SECRET)
    .update(payload)
    .digest("hex");
  return Buffer.from(payload).toString("base64url") + "." + sig;
}

function headersFor(session) {
  const csrf = csrfToken(session);
  return { Cookie: `mbsi_session=${session}; mbsi_csrf=${csrf}`, "x-csrf-token": csrf };
}

async function call(method, path, session, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: session
      ? { ...headersFor(session), ...(body ? {} : {}) }
      : {},
    body,
    redirect: "manual",
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, body: json };
}

let passed = 0;
let failed = 0;
function check(cond, message) {
  if (cond) {
    console.log(`  ok  ${message}`);
    passed++;
  } else {
    console.log(`  FAIL ${message}`);
    failed++;
  }
}

const PDF = Buffer.from(
  "%PDF-1.4\n" +
    "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
    "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n" +
    "trailer<</Root 1 0 R>>\n%%EOF",
  "latin1"
);

// shape "manager" â†’ file + author nomi + categoryId (menejer shakli)
// shape "admin"   â†’ pdf + authorId + categoryId (eski /api/books shakli)
function createForm(overrides = {}) {
  const shape = overrides.shape || "manager";
  const fd = new FormData();
  fd.set("title", overrides.title || "Books-v2 probe kitob");
  fd.set("description", overrides.description || "probe");
  fd.set("language", "UZ");
  fd.set("totalPages", "1");
  fd.set("isPublished", "false");
  if (shape === "admin") {
    fd.set("pdf", new File([PDF], "probe.pdf", { type: "application/pdf" }));
    fd.set("authorId", overrides.authorId);
    fd.set("categoryId", overrides.categoryId);
  } else {
    fd.set("file", new File([PDF], "probe.pdf", { type: "application/pdf" }));
    fd.set("author", overrides.author || "Probe Muallif");
    if (overrides.newCategory) fd.set("newCategory", overrides.newCategory);
    else if (overrides.categoryId) fd.set("categoryId", overrides.categoryId);
    else fd.set("newCategory", "Probe Kategoriya");
  }
  return fd;
}

const admin = await prisma.user.findFirst({
  where: { role: "ADMIN", isActive: true },
});
const manager = await prisma.user.findFirst({
  where: { role: "BOOK_MANAGER", isActive: true },
});
const student = await prisma.user.findFirst({
  where: { role: "STUDENT", isActive: true },
});
const anyAuthor = await prisma.author.findFirst();
const anyCategory = await prisma.category.findFirst();

const adminS = sessionCookie(admin);
const managerS = sessionCookie(manager);
const studentS = sessionCookie(student);

console.log("=== books-v2 probe ===\n");

// 1. Authsiz
{
  const a = await call("GET", "/api/books-v2");
  check(a.status === 401, `GET /api/books-v2 authsiz 401 (got ${a.status})`);
  const b = await call("GET", "/api/books");
  check(b.status === 401, `GET /api/books (eski) authsiz 401 (got ${b.status})`);
  const c = await call("POST", "/api/books-v2");
  check(c.status === 401 || c.status === 403, `POST /api/books-v2 authsiz 401/403 (got ${c.status})`);
}

// 2. Ro'yxat â€” yangi va eski API bir xil
{
  const a = await call("GET", "/api/books-v2?pageSize=20&sort=newest", adminS);
  check(a.status === 200, `GET /api/books-v2 admin uchun 200 (got ${a.status})`);
  check(Array.isArray(a.body?.data), "javob data massiv");
  check((a.body?.pagination?.total ?? 0) > 0, `pagination.total > 0 (${a.body?.pagination?.total})`);
  check(a.body?.data?.[0]?.title, "data[0].title mavjud");

  const b = await call("GET", "/api/books?pageSize=20&sort=newest", adminS);
  check(b.status === 200, `GET /api/books (eski) 200 (got ${b.status})`);
  check(
    b.body?.pagination?.total === a.body?.pagination?.total,
    `eski va yangi API bir xil son qaytaradi (${b.body?.pagination?.total} vs ${a.body?.pagination?.total})`
  );

  const all = await call("GET", "/api/books-v2?publishedOnly=false&pageSize=50", adminS);
  check(all.status === 200, `publishedOnly=false ishlaydi (got ${all.status})`);
}

// 3. Yangi API orqali kitob yaratish (menejer shakli)
let createdNew;
{
  const r = await call("POST", "/api/books-v2", managerS, createForm());
  check(r.status === 201, `POST /api/books-v2 201 (got ${r.status}: ${JSON.stringify(r.body?.error) || ""})`);
  createdNew = r.body?.data;
  check(Boolean(createdNew?.id && createdNew?.slug), "yaratilgan kitobda id va slug bor");
}

// 4. Eski endpointlar yangi API'ga delegatsiya qiladi
{
  const a = await call("POST", "/api/manager/books", managerS, createForm({ title: "Eski manager probe" }));
  check(a.status === 201, `POST /api/manager/books 201 (got ${a.status}: ${JSON.stringify(a.body?.error) || ""})`);

  const b = await call("POST", "/api/admin/upload", managerS, createForm({ title: "Eski upload probe" }));
  check(b.status === 201, `POST /api/admin/upload 201 (got ${b.status}: ${JSON.stringify(b.body?.error) || ""})`);

  const c = await call(
    "POST",
    "/api/books",
    adminS,
    createForm({
      shape: "admin",
      title: "Eski books admin probe",
      authorId: anyAuthor?.id,
      categoryId: anyCategory?.id,
    })
  );
  check(c.status === 201, `POST /api/books (admin shakli) 201 (got ${c.status}: ${JSON.stringify(c.body?.error) || ""})`);
}

// 5. Ruxsatsiz rol
{
  const r = await call("POST", "/api/books-v2", studentS, createForm({ title: "Talaba probe" }));
  check(r.status === 403, `Talaba POST /api/books-v2 403 (got ${r.status})`);
}

// 6. GET / PATCH / DELETE [id]
{
  if (!createdNew?.id) {
    check(false, "yaratilgan kitob idsi yo'q â€” [id] testlari o'tkazildi");
  } else {
    const g = await call("GET", `/api/books-v2/${createdNew.id}`, adminS);
    check(g.status === 200, `GET /api/books-v2/[id] 200 (got ${g.status})`);
    check(g.body?.data?.title === createdNew.title, "GET title mos");

    const p = await call("PATCH", `/api/books-v2/${createdNew.id}`, adminS, createForm({ title: "Probe yangilangan" }));
    check(p.status === 200, `PATCH /api/books-v2/[id] 200 (got ${p.status}: ${JSON.stringify(p.body?.error) || ""})`);
    check(p.body?.data?.title === "Probe yangilangan", "PATCH title o'zgardi");

    const pOld = await call("PATCH", `/api/books/${createdNew.id}`, adminS, createForm({ title: "Probe eski PATCH" }));
    check(pOld.status === 200, `PATCH /api/books/[id] (eski) 200 (got ${pOld.status})`);

    const dOld = await call("DELETE", `/api/books/${createdNew.id}`, adminS);
    check(dOld.status === 200, `DELETE /api/books/[id] (eski) 200 (got ${dOld.status})`);

    const g2 = await call("GET", `/api/books-v2/${createdNew.id}`, adminS);
    check(g2.status === 404, `o'chirilgan kitob 404 (got ${g2.status})`);
  }
}

// 7. Menejer GET hali o'z joyida
{
  const r = await call("GET", "/api/manager/books", managerS);
  check(r.status === 200, `GET /api/manager/books 200 (got ${r.status})`);
  check(Array.isArray(r.body?.data), "manager ro'yxati massiv");
}

// 8. Sync (eski API kitoblarini moslashtirish)
{
  const r = await call("POST", "/api/books-v2/sync", adminS);
  check(r.status === 200, `POST /api/books-v2/sync 200 (got ${r.status}: ${JSON.stringify(r.body?.error) || ""})`);
  const d = r.body?.data;
  if (d) {
    console.log(
      `       sync â†’ total=${d.total} created=${d.created} updated=${d.updated} unchanged=${d.unchanged} failed=${d.failed}`
    );
    check(d.total > 0, "sync total > 0");
    check(d.failed === 0, "sync'da xato yo'q");
  } else {
    check(false, "sync javobi data kardi");
  }
}

// 9. Tozalash (avvalgi urinishlarda qolgan probe kitoblari ham)
{
  const titles = [
    "Books-v2 probe kitob",
    "Eski manager probe",
    "Eski upload probe",
    "Eski books admin probe",
    "Probe yangilangan",
    "Probe eski PATCH",
  ];
  const leftovers = await prisma.book.findMany({
    where: { title: { in: titles } },
    select: { id: true, title: true },
  });
  for (const b of leftovers) {
    const r = await call("DELETE", `/api/books-v2/${b.id}`, adminS);
    check(r.status === 200, `tozalash: "${b.title}" o'chirildi (${r.status})`);
  }
}
try {
  await prisma.category.deleteMany({ where: { name: { startsWith: "Probe" } } });
  await prisma.author.deleteMany({ where: { name: "Probe Muallif" } });
} catch (e) {
  console.log(`  (tozalash: ${e.message})`);
}

console.log(`\n=== ${passed} ok, ${failed} FAIL ===`);
await prisma.$disconnect();
process.exit(failed ? 1 : 0);
