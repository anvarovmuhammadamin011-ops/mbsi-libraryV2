import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

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
const b = "https://mbsi-library-v2.vercel.app";
const bookId = process.env.BOOK_ID || "cmu5ap9cs0003ov4c0vjy2qwu";

function sign(bookId, expiresSec = 3600) {
  const expires = Math.floor(Date.now() / 1000) + expiresSec;
  const sig = crypto.createHmac("sha256", APP_SECRET).update(`${bookId}:${expires}`).digest("hex");
  return `/api/pdf/${bookId}?expires=${expires}&sig=${sig}`;
}

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
  console.log("login:", L.status, "cookie:", m ? m[1] : "none");

  const url = b + sign(bookId);
  const R = await fetch(url, { headers: { Cookie: c } });
  console.log("pdf status:", R.status);
  console.log("pdf body:", await R.text());
})();