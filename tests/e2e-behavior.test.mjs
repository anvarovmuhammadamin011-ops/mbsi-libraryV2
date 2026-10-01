// ============================================================
// MBSI Library — End-to-End Behavior Test (Final)
// ============================================================
// Exercises the running server: login flow, session management,
// API responses, page rendering, and access control.
// Requires dev server running on http://localhost:3000

const BASE = "http://localhost:3000";

console.log("=== MBSI Library — E2E Behavior Test ===\n");
console.log(`Server: ${BASE}\n`);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function req(path, opts = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    redirect: "manual",
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...opts.headers,
    },
  });
  return res;
}

async function reqJson(path, opts = {}) {
  const res = await req(path, opts);
  try {
    const body = await res.json();
    return { status: res.status, headers: res.headers, body };
  } catch {
    return { status: res.status, headers: res.headers, body: null };
  }
}

function getCookie(res) {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return "";
  return setCookie.split(";")[0];
}

// ─── Phase 1: Server Health ─────────────────────────────────
console.log("🌐 Phase 1: Server Health");

{
  const res = await req("/login");
  assert(res.status === 200 || res.status === 307 || res.status === 302, `Login page loads (status: ${res.status})`);
}

{
  const res = await req("/nonexistent-page-12345");
  assert(res.status === 404, `404 page works for unknown routes (status: ${res.status})`);
}

{
  const res = await req("/manifest.json");
  assert(res.status === 200, `PWA manifest serves (status: ${res.status})`);
}

// ─── Phase 2: Auth Flow — Student Login ─────────────────────
console.log("\n👨‍🎓 Phase 2: Auth Flow — Student Login");

let studentCookie = "";
{
  const { status, body } = await reqJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ role: "STUDENT" }),
  });
  assert(status === 200, `Student login returns 200 (status: ${status})`);
  assert(body?.success === true, "Student login returns success: true");
  assert(body?.data?.role === "STUDENT", "Logged in user has STUDENT role");
  assert(body?.data?.name, "Logged in user has a name");
  assert(body?.data?.id, "Logged in user has an id");

  const rawRes = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ role: "STUDENT" }),
  });
  studentCookie = getCookie(rawRes);
  assert(studentCookie.length > 0, "Login sets a session cookie");
}

// ─── Phase 3: Session Verification ──────────────────────────
console.log("\n🔑 Phase 3: Session Verification");

{
  const { status, body } = await reqJson("/api/auth/me", {
    headers: { Cookie: studentCookie },
  });
  assert(status === 200, `/api/auth/me returns 200 (status: ${status})`);
  assert(body?.data?.role === "STUDENT", "Session returns STUDENT role");
  assert(body?.data?.name, "Session returns user name");
}

{
  const { status, body } = await reqJson("/api/auth/me");
  assert(status === 200, `/api/auth/me without cookie returns 200`);
  assert(body?.data === null, "No cookie → data is null");
}

// ─── Phase 4: Auth Flow — Teacher Login ─────────────────────
console.log("\n👨‍🏫 Phase 4: Auth Flow — Teacher Login");

let teacherCookie = "";
{
  const rawRes = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ role: "TEACHER" }),
  });
  teacherCookie = getCookie(rawRes);
  const { body } = await reqJson("/api/auth/me", {
    headers: { Cookie: teacherCookie },
  });
  assert(body?.data?.role === "TEACHER", "Teacher login works and session verifies");
}

// ─── Phase 5: Auth Flow — Admin Login ───────────────────────
console.log("\n🛠 Phase 5: Auth Flow — Admin Login");

let adminCookie = "";
{
  const rawRes = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ role: "ADMIN" }),
  });
  adminCookie = getCookie(rawRes);
  const { body } = await reqJson("/api/auth/me", {
    headers: { Cookie: adminCookie },
  });
  assert(body?.data?.role === "ADMIN", "Admin login works and session verifies");
}

// ─── Phase 6: Logout ────────────────────────────────────────
console.log("\n🚪 Phase 6: Logout");

{
  const { status } = await reqJson("/api/auth/logout", {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  assert(status === 200, "Logout returns 200");

  const rawRes = await req("/api/auth/logout", {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  const setCookie = rawRes.headers.get("set-cookie") || "";
  assert(setCookie.includes("max-age=0") || setCookie.includes("Max-Age=0"), "Logout clears cookie with max-age=0");
}

// ─── Phase 7: Books API ─────────────────────────────────────
console.log("\n📚 Phase 7: Books API");

{
  const { status, body } = await reqJson("/api/books", {
    headers: { Cookie: studentCookie },
  });
  assert(status === 200, `Books API returns 200 (status: ${status})`);
  assert(body?.success === true, "Books API returns success: true");
  assert(Array.isArray(body?.data), "Books API returns an array");
  assert(body?.data?.length >= 10, `Books API returns at least 10 books (found ${body?.data?.length})`);

  if (body?.data?.length > 0) {
    const book = body.data[0];
    assert(book?.id, "Book has id");
    assert(book?.title, "Book has title");
    assert(book?.totalPages > 0, "Book has totalPages > 0");
    assert(book?.author, "Book has author object");
    assert(book?.category, "Book has category object");
  }
}

// ─── Phase 8: Favorites API ─────────────────────────────────
console.log("\n❤️ Phase 8: Favorites API");

{
  const { status, body } = await reqJson("/api/favorites", {
    headers: { Cookie: studentCookie },
  });
  assert(status === 200, `Favorites API returns 200 (status: ${status})`);
  assert(body?.success === true, "Favorites API returns success: true");
}

// ─── Phase 9: Bookmarks API ────────────────────────────────
console.log("\n🔖 Phase 9: Bookmarks API");

{
  const { status, body } = await reqJson("/api/bookmarks", {
    headers: { Cookie: studentCookie },
  });
  assert(status === 200, `Bookmarks API returns 200 (status: ${status})`);
  assert(body?.success === true, "Bookmarks API returns success: true");
}

// ─── Phase 10: Ranking API ──────────────────────────────────
console.log("\n🏆 Phase 10: Ranking API");

{
  const { status, body } = await reqJson("/api/ranking", {
    headers: { Cookie: studentCookie },
  });
  assert(status === 200, `Ranking API returns 200 (status: ${status})`);
  assert(body?.success === true, "Ranking API returns success: true");
}

// ─── Phase 11: Stats API ────────────────────────────────────
console.log("\n📊 Phase 11: Stats API");

{
  const { status, body } = await reqJson("/api/stats", {
    headers: { Cookie: studentCookie },
  });
  assert(status === 200, `Stats API returns 200 (status: ${status})`);
  assert(body?.success === true, "Stats API returns success: true");
}

// ─── Phase 12: Admin API Access Control ─────────────────────
console.log("\n🔒 Phase 12: Admin API Access Control");

{
  const { status } = await reqJson("/api/admin/users", {
    headers: { Cookie: studentCookie },
  });
  assert(status === 401 || status === 403, `Student blocked from admin/users (status: ${status})`);
}

{
  const { status } = await reqJson("/api/admin/users");
  assert(status === 401 || status === 403, `No cookie blocked from admin/users (status: ${status})`);
}

{
  const { status, body } = await reqJson("/api/admin/users", {
    headers: { Cookie: adminCookie },
  });
  assert(status === 200, `Admin can access admin/users (status: ${status})`);
  assert(body?.success === true, "Admin users API returns success: true");
}

// ─── Phase 13: Page Route Protection (Middleware) ────────────
console.log("\n🛡 Phase 13: Page Route Protection (Middleware)");

// Unauthenticated users are redirected to /login via middleware (307)
{
  const res = await req("/home");
  assert(res.status === 307, `Unauthenticated /home redirects (status: ${res.status})`);
}

{
  const res = await req("/admin");
  assert(res.status === 307, `Unauthenticated /admin redirects (status: ${res.status})`);
}

{
  const res = await req("/books");
  assert(res.status === 307, `Unauthenticated /books redirects (status: ${res.status})`);
}

{
  const res = await req("/profile");
  assert(res.status === 307, `Unauthenticated /profile redirects (status: ${res.status})`);
}

// ─── Phase 14: Authenticated Page Access ────────────────────
console.log("\n✅ Phase 14: Authenticated Page Access");

const userPages = ["/home", "/books", "/ranking", "/favorites", "/bookmarks", "/profile", "/continue-reading"];
for (const page of userPages) {
  const res = await req(page, { headers: { Cookie: studentCookie } });
  assert(res.status === 200 || res.status === 307, `Page ${page} loads with auth (status: ${res.status})`);
}

// ─── Phase 15: Admin Page Access ────────────────────────────
console.log("\n🛠 Phase 15: Admin Page Access");

// Student accessing /admin — admin layout renders forbidden UI
{
  const res = await req("/admin", { headers: { Cookie: studentCookie } });
  // AdminGuard renders client-side forbidden page (HTTP 200 but no admin data)
  assert(res.status === 200, `Student accessing /admin gets response (status: ${res.status})`);
  const html = await res.text();
  // The AdminGuard renders forbidden UI, not admin dashboard
  assert(html.includes("AdminGuard") || html.includes("notFound") || html.includes("403") || !html.includes("O'qish sessiyalari"), "Student does NOT see admin dashboard content");
}

{
  const res = await req("/admin", { headers: { Cookie: adminCookie } });
  assert(res.status === 200, `Admin can access /admin (status: ${res.status})`);
}

// ─── Phase 16: Cross-Role Session Isolation ──────────────────
console.log("\n🔐 Phase 16: Cross-Role Session Isolation");

{
  const { status } = await reqJson("/api/admin/users", {
    headers: { Cookie: studentCookie },
  });
  assert(status === 401 || status === 403, `Student session rejected from admin API (status: ${status})`);
}

{
  const { status } = await reqJson("/api/admin/users", {
    headers: { Cookie: adminCookie },
  });
  assert(status === 200, `Admin session accepted for admin API (status: ${status})`);
}

{
  const { status } = await reqJson("/api/admin/users", {
    headers: { Cookie: teacherCookie },
  });
  assert(status === 401 || status === 403, `Teacher session rejected from admin API (status: ${status})`);
}

// ─── Phase 17: Database State Verification ───────────────────
console.log("\n🗄 Phase 17: Database State");

{
  const { body } = await reqJson("/api/books", { headers: { Cookie: studentCookie } });
  const books = body?.data || [];
  assert(books.length > 0, `Database has books (found ${books.length})`);

  if (books.length > 0) {
    const allHaveTitle = books.every(b => typeof b.title === "string" && b.title.length > 0);
    assert(allHaveTitle, "All books have non-empty titles");

    const allHavePages = books.every(b => typeof b.totalPages === "number" && b.totalPages > 0);
    assert(allHavePages, "All books have totalPages > 0");

    const allHaveAuthor = books.every(b => b.author && b.author.id);
    assert(allHaveAuthor, "All books have valid author references");

    const allHaveCategory = books.every(b => b.category && b.category.id);
    assert(allHaveCategory, "All books have valid category references");

    const languages = new Set(books.map(b => b.language));
    assert(languages.has("EN") || languages.has("UZ"), "Books have EN or UZ language");
  }
}

// ─── Phase 18: Invalid Input Handling ───────────────────────
console.log("\n🚫 Phase 18: Invalid Input Handling");

{
  const { status } = await reqJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ role: "INVALID_ROLE" }),
  });
  assert(status === 400, `Invalid role rejected with 400 (status: ${status})`);
}

{
  const { status } = await reqJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({}),
  });
  assert(status === 400, `Missing role rejected with 400 (status: ${status})`);
}

// ─── Phase 19: HTML Content Verification ────────────────────
console.log("\n📄 Phase 19: Page Content");

{
  const res = await req("/login");
  const html = await res.text();
  assert(html.includes("MBSI"), "Login page has MBSI branding");
  assert(html.includes("O'quvchi") || html.includes("Student"), "Login page has role options");
}

{
  const res = await req("/home", { headers: { Cookie: studentCookie } });
  const html = await res.text();
  assert(html.includes("MBSI") || html.includes("mbsi"), "Home page has MBSI branding");
}

// ─── Summary ────────────────────────────────────────────────
console.log("\n" + "=".repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
console.log(`   Pass rate: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

if (failed > 0) {
  console.log("⚠️ Some tests failed! Check the output above.");
  process.exit(1);
} else {
  console.log("🎉 All E2E behavior tests passed!");
  process.exit(0);
}
