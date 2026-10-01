// Dev serverni toza qayta ishga tushirish (detached, log faylga).
// Ishlatish: node tests/restart-dev.mjs
import { execSync, spawn } from "node:child_process";
import { openSync } from "node:fs";

// 1) 3000 portni eshituvchi jarayonlarni topish va o'ldirish
function killPort3000() {
  try {
    const out = execSync("netstat -ano | grep :3000 | grep LISTENING").toString();
    const pids = [...new Set(out.split("\n").map((l) => l.trim().split(/\s+/).pop()).filter((p) => p && /^\d+$/.test(p)))];
    for (const pid of pids) {
      console.log("PID o'ldirilmoqda:", pid);
      execSync(`taskkill //F //PID ${pid} 2>nul || true`);
    }
  } catch {
    console.log("3000 portda jarayon topilmadi");
  }
}

killPort3000();
await new Promise((r) => setTimeout(r, 1500));

// 2) .next keshini tozalash (stale kompilyatsiya muammosi)
try {
  execSync("rm -rf .next", { stdio: "inherit" });
  console.log(".next keshi tozalandi");
} catch {
  console.warn(".next o'chirishda ogohlantirish (davom etamiz)");
}

// 3) Dev serverni detached rejimda ishga tushirish
const log = openSync("dev-server.log", "a");
const child = spawn("npm", ["run", "dev"], {
  detached: true,
  stdio: ["ignore", log, log],
  env: process.env,
  shell: true,
});
child.unref();
console.log("Dev server fon rejimida ishga tushdi (log: dev-server.log)");

// 4) Server tayyor bo'lishini kutish
process.stdout.write("Server tayyor bo'lishini kutish");
for (let i = 0; i < 120; i++) {
  try {
    const res = await fetch("http://localhost:3000/");
    if (res.ok) {
      console.log("\n✅ Server tayyor: http://localhost:3000");
      process.exit(0);
    }
  } catch {}
  await new Promise((r) => setTimeout(r, 1000));
  process.stdout.write(".");
}
console.log("\n⚠️ Server 120s ichida javob bermadi — dev-server.log ni tekshiring");
process.exit(1);
