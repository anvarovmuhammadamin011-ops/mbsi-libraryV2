const b = "https://mbsi-library-v2.vercel.app";
(async () => {
  const L = await fetch(b + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "student", password: "demo123" }),
    redirect: "manual",
  });
  console.log("login status:", L.status);
  const sc = L.headers.get("set-cookie") || "";
  const m = sc.match(/([^;=]+)=([^;]*)/);
  const c = m ? m[1] + "=" + m[2] : "";
  console.log("cookie name:", m ? m[1] : "none");
  const books = await fetch(b + "/api/books", { headers: { Cookie: c } });
  console.log("books status:", books.status);
  const j = await books.json();
  console.log("books json type:", Array.isArray(j) ? "array len=" + j.length : typeof j + (j && j.books ? " books=" + j.books.length : ""));
})();