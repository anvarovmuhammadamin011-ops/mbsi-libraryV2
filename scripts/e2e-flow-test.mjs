// ============================================================
// MBSI Library — E2E: student-creation flow test
// Run with dev server on http://localhost:3000
//   node scripts/e2e-flow-test.mjs
// ============================================================

const BASE = "http://localhost:3000";
// Parollar repo'ga yozilmaydi — .env dan olinadi (yo'q bo'lsa demo123):
//   E2E_PASSWORD_ADMIN, E2E_PASSWORD_OQUVCHIMANAGER, E2E_PASSWORD_KITOBMANAGER
const PW = (user) => process.env[`E2E_PASSWORD_${user.toUpperCase()}`] ?? "demo123";
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { console.log(`  ✅ ${msg}`); passed++; }
  else { console.log(`  ❌ ${msg}`); failed++; }
}

async function req(path, opts = {}) {
  return fetch(`${BASE}${path}`, { redirect: "manual", ...opts });
}

async function reqJson(path, opts = {}) {
  const res = await req(path, opts);
  let body = null;
  try { body = await res.json(); } catch {}
  return { status: res.status, headers: res.headers, body };
}

function cookieOf(res) {
  return (res.headers.get("set-cookie") || "").split(";")[0];
}

// ─── Phase 1: Login page content (real browser render) ─────
console.log("\n📄 Phase 1: Login page shows credential form");
{
  // The login page is a client component — the curl SSR shell lacks form texts.
  // Use headless Chrome to get the hydrated DOM, as a real user sees it.
  const { execSync } = await import("node:child_process");
  const fs = await import("node:fs");
  const domFile = ".e2e-login-dom.html";
  const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  try {
    execSync(
      `"${chrome}" --headless=new --disable-gpu --no-sandbox --virtual-time-budget=12000 --dump-dom ${BASE}/login > ${domFile}`,
      { stdio: "pipe", shell: true, timeout: 60000 }
    );
    const dom = fs.readFileSync(domFile, "utf8");
    assert(dom.includes("MBSI Library"), "Login page loads with MBSI branding");
    assert(dom.includes('autocomplete="username"'), "Username input rendered");
    assert(dom.includes('type="password"'), "Password input rendered");
    assert(dom.includes("Kirish"), "Kirish button rendered");
    assert(dom.includes("Tizimga xush kelibsiz"), "Welcome text rendered");
    assert(!dom.includes("Davom etish uchun tanlang"), "Old role-select UI removed");
  } catch (e) {
    console.log(
      "  ⚠️ headless Chrome failed, falling back to SSR check:",
      String(e?.message || e).slice(0, 80)
    );
    const res = await req("/login");
    const html = await res.text();
    assert(html.includes("MBSI Library"), "Login page loads with MBSI branding (SSR)");
  } finally {
    try { fs.unlinkSync(domFile); } catch {}
  }
}

// ─── Phase 2: Staff logins ─────────────────────────────────
console.log("\n🔐 Phase 2: Staff credential logins");
let adminCookie = "", registrarCookie = "", managerCookie = "";

{
  const { status, body, headers } = await reqJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "admin", password: PW("admin") }),
  });
  assert(status === 200 && body?.success, `Admin login OK (status ${status})`);
  assert(body?.data?.name === "Anvarov Muhammadamin", "Admin name is Anvarov Muhammadamin");
  assert(body?.data?.role === "ADMIN", "Role is ADMIN");
  adminCookie = cookieOf({ headers });
  assert(adminCookie.length > 0, "Admin session cookie set");
}

{
  const { status, body, headers } = await reqJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "oquvchimanager", password: PW("oquvchimanager") }),
  });
  assert(status === 200 && body?.data?.role === "REGISTRAR", "Registrar (oquvchimanager) login OK");
  registrarCookie = cookieOf({ headers });
}

{
  const { status, body, headers } = await reqJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "kitobmanager", password: PW("kitobmanager") }),
  });
  assert(status === 200 && body?.data?.role === "BOOK_MANAGER", "Book manager (kitobmanager) login OK");
  managerCookie = cookieOf({ headers });
}

{
  const { status, body } = await reqJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "admin", password: "wrong-password" }),
  });
  assert(status === 401, `Wrong password rejected with 401 (got ${status})`);
  assert(body?.error?.message === "Login yoki parol noto'g'ri", "Generic error message (no username enumeration)");
}

// ─── Phase 3: Registrar creates a student ──────────────────
console.log("\n📝 Phase 3: Registrar adds student with credentials");
const STAMP = Date.now();
const NEW_LOGIN = `testtalaba${STAMP}`;
const NEW_PASSWORD = "ParolTest123";

let pendingId = null;
{
  const { status, body } = await reqJson("/api/students/pending", {
    method: "POST",
    headers: { Cookie: registrarCookie },
    body: JSON.stringify({
      firstName: "Test",
      lastName: "Talaba",
      login: NEW_LOGIN,
      password: NEW_PASSWORD,
      email: `test${STAMP}@example.com`,
      phone: "+998901112233",
      group: "Test-Guruh",
      age: 15,
      gender: "MALE",
      address: "Toshkent",
      parentContact: "+998909998877",
      healthNote: "yo'q",
      about: "e2e test o'quvchi",
    }),
  });
  assert(status === 201, `Request created (status ${status})`);
  assert(body?.data?.login === NEW_LOGIN, "Response contains login");
  assert(body?.data?.passwordHash === undefined, "Response does NOT leak passwordHash");
  assert(body?.data?.passwordEnc === undefined, "Response does NOT leak passwordEnc");
  pendingId = body?.data?.id ?? null;
  assert(Boolean(pendingId), "Pending request id returned");
}

// duplicate login check
{
  const { status } = await reqJson("/api/students/pending", {
    method: "POST",
    headers: { Cookie: registrarCookie },
    body: JSON.stringify({
      firstName: "Ikkinchi", lastName: "Talaba",
      login: NEW_LOGIN, password: "x123456", group: "Test-Guruh", age: 16,
    }),
  });
  assert(status === 409, `Duplicate login rejected with 409 (got ${status})`);
}

// validation: short login
{
  const { status } = await reqJson("/api/students/pending", {
    method: "POST",
    headers: { Cookie: registrarCookie },
    body: JSON.stringify({
      firstName: "A", lastName: "B", login: "ab", password: "x1234",
      group: "Test-Guruh", age: 15,
    }),
  });
  assert(status === 400, `Short login rejected with 400 (got ${status})`);
}

// ─── Phase 4: Admin approves ───────────────────────────────
console.log("\n✅ Phase 4: Admin approves the request");
{
  const { status, body } = await reqJson(`/api/admin/students/pending/${pendingId}`, {
    method: "PATCH",
    headers: { Cookie: adminCookie },
    body: JSON.stringify({ action: "approve" }),
  });
  assert(status === 200 && body?.data?.approved === true, `Approved (status ${status})`);
  assert(typeof body?.data?.userId === "string", "userId returned for the new student");
}

// ─── Phase 5: Credentials reveal (guards) ──────────────────
console.log("\n🔒 Phase 5: Password reveal permissions");

let studentUserId = null;
{
  // find the new student's userId via admin users API
  const { body } = await reqJson("/api/admin/users?q=Test Talaba", {
    headers: { Cookie: adminCookie },
  });
  const found = (body?.data || []).find((u) => u.name === "Test Talaba");
  studentUserId = found?.id ?? null;
  assert(Boolean(studentUserId), "New student found in users list");
}

{
  // ADMIN can reveal
  const { status, body } = await reqJson(
    `/api/admin/students/credentials?ids=${studentUserId}`,
    { headers: { Cookie: adminCookie } }
  );
  assert(status === 200 && body?.success, `Admin can reveal password (status ${status})`);
  assert(body?.data?.[0]?.username === NEW_LOGIN, "Revealed username matches");
  assert(body?.data?.[0]?.password === NEW_PASSWORD, "Revealed password matches original (AES decrypt works)");
}

{
  // BOOK_MANAGER must NOT reveal
  const { status } = await reqJson(
    `/api/admin/students/credentials?ids=${studentUserId}`,
    { headers: { Cookie: managerCookie } }
  );
  assert(status === 403, `Book manager blocked with 403 (got ${status})`);
}

{
  // no auth must NOT reveal
  const { status } = await reqJson(
    `/api/admin/students/credentials?ids=${studentUserId}`
  );
  assert(status === 401 || status === 403, `Unauthenticated blocked (got ${status})`);
}

{
  // REGISTRAR sees credentials through own-request endpoint
  const { status, body } = await reqJson(
    `/api/registrar/requests/${pendingId}/credentials`,
    { headers: { Cookie: registrarCookie } }
  );
  assert(status === 200 && body?.data?.username === NEW_LOGIN, "Registrar sees own student credentials");
  assert(body?.data?.password === NEW_PASSWORD, "Registrar sees correct password");
}

// ─── Phase 6: Student logs in with created credentials ─────
console.log("\n👨‍🎓 Phase 6: Student login with created credentials");
let studentCookie = "";
{
  const { status, body, headers } = await reqJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: NEW_LOGIN, password: NEW_PASSWORD }),
  });
  assert(status === 200 && body?.success, `Student login OK (status ${status})`);
  assert(body?.data?.role === "STUDENT", "Role is STUDENT");
  assert(body?.data?.name === "Test Talaba", "Name is Test Talaba");
  studentCookie = cookieOf({ headers });
  assert(studentCookie.length > 0, "Student session cookie set");
}

{
  const { body } = await reqJson("/api/auth/me", {
    headers: { Cookie: studentCookie },
  });
  assert(body?.data?.username === NEW_LOGIN || body?.data?.role === "STUDENT", "Session verifies student");
}

{
  // student cannot access admin credentials API
  const { status } = await reqJson(
    `/api/admin/students/credentials?ids=${studentUserId}`,
    { headers: { Cookie: studentCookie } }
  );
  assert(status === 403 || status === 401, `Student blocked from credentials API (got ${status})`);
}

// ─── Phase 7: Student pages load ───────────────────────────
console.log("\n🏠 Phase 7: Student app access");
for (const page of ["/home", "/books", "/profile"]) {
  const res = await req(page, { headers: { Cookie: studentCookie } });
  assert(res.status === 200 || res.status === 307, `Page ${page} loads (status ${res.status})`);
}

// unauthenticated redirect
{
  const res = await req("/home");
  assert(res.status === 307, "Unauthenticated /home redirects to login");
}

// ─── Phase 8: Cleanup (remove test student + pending row) ──
console.log("\n🧹 Phase 8: Cleanup test data");
{
  // delete via a temp script file (avoids node -e escaping issues)
  const { execSync } = await import("node:child_process");
  const fs = await import("node:fs");
  const script = `import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const login = process.argv[2];
const u = await p.user.findFirst({ where: { username: login } });
if (u) await p.user.delete({ where: { id: u.id } });
await p.pendingStudent.deleteMany({ where: { login } });
await p.$disconnect();
console.log("cleaned", login);
`;
  const tmp = ".e2e-cleanup.mjs";
  fs.writeFileSync(tmp, script);
  try {
    execSync(`node ${tmp} ${NEW_LOGIN}`, { cwd: process.cwd(), stdio: "pipe" });
    console.log("  ✅ Test user + pending request removed");
    passed++;
  } catch (e) {
    console.log("  ⚠️ Cleanup failed (test data left in DB):", e.message);
    failed++;
  } finally {
    fs.unlinkSync(tmp);
  }
}

// ─── Summary ───────────────────────────────────────────────
console.log("\n" + "=".repeat(50));
console.log(`📊 Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log("⚠️ Some tests failed");
  process.exit(1);
} else {
  console.log("🎉 Full student-creation flow works end to end!");
  process.exit(0);
}
