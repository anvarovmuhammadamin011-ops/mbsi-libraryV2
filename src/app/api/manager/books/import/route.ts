import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { route, readJson } from "@/lib/server/handler";
import { requireBookManager } from "@/lib/server/auth";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";

const ROOT = process.cwd();
const CACHE_DIR = path.join(ROOT, "scripts", "cache");
const SCRIPT = path.join(CACHE_DIR, "..", "import-library.mjs");
const PROGRESS_FILE = path.join(CACHE_DIR, "import-progress.json");
const PROCESS_FILE = path.join(CACHE_DIR, "import-process.json");
const LOG_FILE = path.join(CACHE_DIR, "import-run.log");
const REPORT_FILE = path.join(CACHE_DIR, "import-library-report.json");

const KNOWN_SOURCES = new Set(["ziyouz", "handybook"]);
const KNOWN_ORDERS = new Set(["size", "score", "id"]);

type Progress = {
  target?: number;
  attempted?: number;
  of?: number;
  ok?: number;
  failed?: number;
  elapsedSec?: number;
  ratePerSec?: number;
  last?: string;
  at?: string;
};

type Proc = { pid: number; startedAt: string; args: string[] };

function readJsonFile<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

function isAlive(pid?: number): boolean {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function currentProcess(): Proc | null {
  const p = readJsonFile<Proc>(PROCESS_FILE);
  return p && isAlive(p.pid) ? p : null;
}

function logTail(lines = 60): string {
  try {
    const raw = fs.readFileSync(LOG_FILE, "utf8");
    return raw.split(/\r?\n/).slice(-lines).join("\n");
  } catch {
    return "";
  }
}

function ageSeconds(iso?: string): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : Math.round((Date.now() - t) / 1000);
}

// Import qachon oxirgi marta yozgan — jarayon o'limini shu bilan sezamiz
// (pid allaqachon boshqa jarayonga berilgan bo'lishi mumkin).
// Yangi boshlangan jarayon bir necha soniyada progress faylini yozmaydi,
// shuning uchun grace period beramiz.
const START_GRACE_MS = 90_000;
const STALL_AFTER_MS = 120_000;

function mtime(file: string): number {
  try {
    return fs.statSync(file).mtimeMs;
  } catch {
    return 0;
  }
}

function progressStalled(p: Proc): boolean {
  const startedMs = Date.parse(p.startedAt);
  if (Number.isNaN(startedMs)) return true;

  // Hali boshlanish grace period'ida — o'lik deb hisoblamaymiz.
  if (Date.now() - startedMs < START_GRACE_MS) return false;

  // Skript startedan keyin log'ga yozgan bo'lsa — tirik.
  if (mtime(LOG_FILE) > startedMs) return false;

  // yoki progress faylini yangilagan bo'lsa — tirik.
  const prog = readJsonFile<Progress>(PROGRESS_FILE);
  const progMs = Math.max(mtime(PROGRESS_FILE), prog?.at ? Date.parse(prog.at) : 0);
  if (progMs > startedMs) return false;

  // Ikkalasi ham eski — jarayon osib qolgan.
  return Date.now() - progMs > STALL_AFTER_MS;
}

function buildArgs(body: Record<string, unknown>): string[] {
  const args: string[] = [];

  const target = Number(body.target);
  if (Number.isFinite(target) && target > 0) args.push(`--target=${Math.floor(target)}`);

  const sources = String(body.sources ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => KNOWN_SOURCES.has(s));
  if (sources.length) args.push(`--sources=${sources.join(",")}`);

  const order = String(body.order ?? "");
  if (KNOWN_ORDERS.has(order)) args.push(`--order=${order}`);

  const concurrency = Number(body.concurrency);
  if (Number.isFinite(concurrency) && concurrency > 0 && concurrency <= 16) {
    args.push(`--concurrency=${Math.floor(concurrency)}`);
  }

  const overscan = Number(body.overscan);
  if (Number.isFinite(overscan) && overscan > 0) args.push(`--overscan=${overscan}`);

  if (body.resume === true) args.push("--resume");
  if (body.dryRun === true) args.push("--dry-run");

  return args;
}

function killTree(pid: number) {
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
  } else {
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      try {
        process.kill(pid, "SIGTERM");
      } catch {
        /* o'lib bo'lgan */
      }
    }
  }
}

function start(body: Record<string, unknown>) {
  const running = currentProcess();
  if (running && !progressStalled(running)) {
    throw new ApiError(
      ERROR_CODES.VALIDATION,
      "Import allaqachon ketmoqda. Avval to'xtating.",
      409
    );
  }
  if (running) killTree(running.pid);

  const args = buildArgs(body);

  const out = fs.openSync(LOG_FILE, "a");
  fs.writeSync(
    out,
    `\n${"=".repeat(60)}\n[${new Date().toISOString()}] boshlandi: ${args.join(" ") || "(default)"}\n`
  );

  // Eski ishning progressini tozalaymiz — UI eskirgan raqamni ko'rsatmasin.
  try {
    fs.writeFileSync(
      PROGRESS_FILE,
      JSON.stringify({ target: Number(body.target) || 0, attempted: 0, of: 0, ok: 0, failed: 0, at: new Date().toISOString() })
    );
  } catch {
    /* yozishda xato — skript o'zi qayta yozadi */
  }

  const child = spawn(process.execPath, [SCRIPT, ...args], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", out, out],
    windowsHide: true,
  });

  child.unref();
  fs.closeSync(out);

  const proc: Proc = {
    pid: child.pid!,
    startedAt: new Date().toISOString(),
    args,
  };
  fs.writeFileSync(PROCESS_FILE, JSON.stringify(proc, null, 1));

  // Yakunlanishini kuzatamiz — pid faylini tozalash uchun.
  child.on("exit", (code, signal) => {
    try {
      const cur = readJsonFile<Proc>(PROCESS_FILE);
      if (cur?.pid === proc.pid) fs.unlinkSync(PROCESS_FILE);
      fs.appendFileSync(
        LOG_FILE,
        `\n[tugadi] code=${code} signal=${signal} vaqt=${new Date().toISOString()}\n`
      );
    } catch {
      /* ionor */
    }
  });
  child.on("error", (err) => {
    try {
      fs.appendFileSync(LOG_FILE, `\n[xato] ${String(err)}\n`);
    } catch {
      /* ionor */
    }
  });

  return { pid: proc.pid, startedAt: proc.startedAt, args };
}

export const GET = route(async () => {
  await requireBookManager();

  const proc = currentProcess();
  const progress = readJsonFile<Progress>(PROGRESS_FILE);
  const report = readJsonFile<unknown>(REPORT_FILE);
  const running = !!proc && !progressStalled(proc);

  return success({
    running,
    pid: proc?.pid ?? null,
    startedAt: proc?.startedAt ?? null,
    args: proc?.args ?? [],
    progress,
    finishedSecAgo: running ? null : ageSeconds(progress?.at),
    log: logTail(),
    hasReport: !!report,
    script: path.relative(ROOT, SCRIPT),
  });
});

export const POST = route(async (req) => {
  await requireBookManager();

  const body = await readJson<Record<string, unknown>>(req);
  const action = String(body.action ?? "start");

  if (action === "stop") {
    const proc = currentProcess();
    if (!proc) {
      throw new ApiError(ERROR_CODES.VALIDATION, "Import hozir ketmayapti", 409);
    }
    killTree(proc.pid);
    try {
      fs.unlinkSync(PROCESS_FILE);
    } catch {
      /* allaqachon o'chirilgan */
    }
    fs.appendFileSync(LOG_FILE, `\n[to'xtatildi] ${new Date().toISOString()}\n`);
    return success({ stopped: true, pid: proc.pid });
  }

  if (action !== "start") {
    throw new ApiError(ERROR_CODES.VALIDATION, "Noma'lum action", 400);
  }

  const started = start(body);
  return success({ started: true, ...started }, 201);
});
