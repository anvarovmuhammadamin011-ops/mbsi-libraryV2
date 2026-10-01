// PDF larni GitHub Release ga parallel yuklash.
//   node scripts/upload-pdf-release.mjs [--tag=pdfs-v1] [--jobs=6] [--force]
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const a = argv.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split("=").slice(1).join("=") : d;
};
const flag = (n) => argv.includes(`--${n}`);

const TAG = arg("tag", "pdfs-v1");
const JOBS = Math.max(1, Math.min(12, Number(arg("jobs", "6"))));
const REPO = arg("repo", "anvarovmuhammadamin011-ops/mbsi-libraryV2");
const FORCE = flag("force");
const ROOT = process.cwd();
const PDF_DIR = path.join(ROOT, "storage", "private", "pdfs");
const STATE = path.join(ROOT, "scripts", "cache", "pdf-upload-state.json");

function run(cmd, args) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { windowsHide: true });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => resolve({ code, out, err }));
  });
}

async function main() {
  const prisma = new PrismaClient();
  const books = await prisma.book.findMany({ select: { pdfUrl: true } });
  await prisma.$disconnect();

  const wanted = [
    ...new Set(
      books
        .map((b) => b.pdfUrl)
        .filter((k) => k && !/^https?:/i.test(k))
        .map((k) => path.basename(k))
    ),
  ].sort();

  const existing = new Set(
    fs.existsSync(PDF_DIR) ? fs.readdirSync(PDF_DIR).filter((f) => f.endsWith(".pdf")) : []
  );
  const files = wanted.filter((f) => existing.has(f));
  const missing = wanted.filter((f) => !existing.has(f));

  console.log(`DB'da PDF kalitlari: ${wanted.length}`);
  console.log(`  diskda bor:        ${files.length}`);
  console.log(`  diskda yo'q:       ${missing.length}`);
  if (missing.length) console.log(`  (masalan: ${missing.slice(0, 3).join(", ")})`);
  if (!files.length) return;

  // Davom etgan qisman yuklashni ko'rish uchun holat
  let state = {};
  if (!FORCE && fs.existsSync(STATE)) {
    try {
      state = JSON.parse(fs.readFileSync(STATE, "utf8"));
    } catch {
      state = {};
    }
  }
  const todo = FORCE ? files : files.filter((f) => !state[f]);
  console.log(`\nYuklanadi: ${todo.length} ta (${files.length - todo.length} allaqachon yakunlangan)`);
  if (!todo.length) return;

  const totalBytes = todo.reduce((s, f) => s + fs.statSync(path.join(PDF_DIR, f)).size, 0);
  console.log(`Hajm: ${(totalBytes / 1048576).toFixed(0)} MB | parallel: ${JOBS}\n`);

  const rel = await run("gh", [
    "release",
    "view",
    TAG,
    "-R",
    REPO,
    "--json",
    "assets",
    "--jq",
    ".assets[].name",
  ]);
  const uploaded = new Set(
    rel.code === 0
      ? rel.out
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean)
      : []
  );
  const queue = FORCE ? todo : todo.filter((f) => !uploaded.has(f));
  console.log(`Release'da tayyor: ${uploaded.size} | navbatda: ${queue.length}\n`);
  if (!queue.length) return;

  const t0 = Date.now();
  let done = 0;
  let failed = 0;

  async function worker(id) {
    for (;;) {
      const f = queue.pop();
      if (!f) return;
      const full = path.join(PDF_DIR, f);
      const args = ["release", "upload", TAG, full, "-R", REPO];
      if (uploaded.has(f)) args.push("--clobber");
      const r = await run("gh", args);
      done++;
      if (r.code === 0) {
        state[f] = Date.now();
        fs.writeFileSync(STATE, JSON.stringify(state));
        const el = (Date.now() - t0) / 1000;
        const rate = done / Math.max(0.1, el);
        const eta = (queue.length / Math.max(0.01, rate)) | 0;
        if (done % 5 === 0 || queue.length === 0) {
          console.log(
            `  [${done}/${queue.length + done}] ${f.slice(0, 48)} — ${rate.toFixed(2)}/s, ETA ${Math.floor(eta / 60)}m${eta % 60}s`
          );
        }
      } else {
        failed++;
        console.log(`  X ${f} — ${(r.err || r.out).trim().slice(0, 160)}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(JOBS, queue.length) }, (_, i) => worker(i)));

  const el = ((Date.now() - t0) / 1000) | 0;
  console.log(`\nYakun: ${done - failed} muvaffaqiyatli, ${failed} xato, ${el}s`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
