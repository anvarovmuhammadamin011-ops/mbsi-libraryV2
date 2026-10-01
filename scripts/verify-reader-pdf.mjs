const b = "https://mbsi-library-v2.vercel.app";
(async () => {
  const L = await fetch(b + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "student", password: "demo123" }),
    redirect: "manual",
  });
  const sc = L.headers.get("set-cookie") || "";
  const m = sc.match(/([^;=]+)=([^;]*)/);
  const c = m ? m[1] + "=" + m[2] : "";
  // kitob slug'ini olish uchun books API
  const bk = await fetch(b + "/api/books", { headers: { Cookie: c } });
  const j = await bk.json();
  const books = Array.isArray(j) ? j : (j.books || j.data || []);
  console.log("books:", books.length);
  // reader sahifasini (bookId) olish
  const first = books[0];
  console.log("first book fields:", Object.keys(first).join(","));
  const id = first.id || first.slug;
  const pg = await fetch(b + "/reader/" + id, { headers: { Cookie: c } });
  console.log("reader status:", pg.status);
  const html = await pg.text();
  const m2 = html.match(/\/api\/pdf\/[^"\\]+/);
  console.log("signed pdf url:", m2 ? m2[0] : "NOT FOUND in html");
  if (m2) {
    const R = await fetch(b + m2[0].replace(/&amp;/g, "&"), { headers: { Cookie: c } });
    console.log("pdf fetch status:", R.status, R.headers.get("content-type"));
    const buf = Buffer.from(await R.arrayBuffer());
    console.log("bytes:", buf.length, "magic:", buf.slice(0, 5).toString("latin1"));
  }
})();