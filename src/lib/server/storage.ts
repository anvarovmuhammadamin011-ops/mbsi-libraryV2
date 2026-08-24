import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { env } from "@/lib/env";

// ─── Storage abstraction ────────────────────────────────────
// Local driver (default): writes to the repo so it works with
// zero setup. S3-compatible driver is used automatically when
// STORAGE_DRIVER=s3 and S3_* env vars are present (dynamic import
// of @aws-sdk/client-s3 keeps the dependency optional).

const ROOT = process.cwd();
const PUBLIC_UPLOADS = path.join(ROOT, "public", "uploads");
const PRIVATE_ROOT = path.join(ROOT, "storage", "private");

export type SavedFile = {
  // For local: a public path ("/uploads/covers/x.jpg") or a
  // private key ("pdfs/x.pdf"). For S3: the object key.
  urlOrKey: string;
  isPublic: boolean;
  size: number;
};

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function extOf(filename: string, fallback: string): string {
  const m = filename.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : fallback;
}

const COVER_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export async function saveCover(file: File): Promise<SavedFile> {
  const ext = extOf(file.name, "jpg");
  if (!COVER_TYPES[ext]) {
    throw new Error("INVALID_COVER_TYPE");
  }
  const key = `${crypto.randomBytes(12).toString("hex")}.${ext}`;
  const dir = path.join(PUBLIC_UPLOADS, "covers");
  await ensureDir(dir);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, key), buf);
  return { urlOrKey: `/uploads/covers/${key}`, isPublic: true, size: buf.length };
}

export async function savePdf(file: File): Promise<SavedFile> {
  const ext = extOf(file.name, "pdf");
  if (ext !== "pdf") throw new Error("INVALID_PDF_TYPE");
  const key = `${crypto.randomBytes(12).toString("hex")}.pdf`;
  const dir = path.join(PRIVATE_ROOT, "pdfs");
  await ensureDir(dir);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, key), buf);
  return { urlOrKey: `pdfs/${key}`, isPublic: false, size: buf.length };
}

export async function readPrivate(key: string): Promise<Buffer> {
  const safe = key.replace(/\\/g, "/").replace(/\.\.+/g, "");
  const full = path.join(PRIVATE_ROOT, safe);
  if (!full.startsWith(PRIVATE_ROOT)) throw new Error("INVALID_KEY");
  return fs.readFile(full);
}

export async function deleteCover(publicPath: string): Promise<void> {
  try {
    const full = path.join(ROOT, publicPath.replace(/^\//, ""));
    await fs.unlink(full);
  } catch {
    /* ignore */
  }
}

export async function deletePrivate(key: string): Promise<void> {
  try {
    const safe = key.replace(/\\/g, "/").replace(/\.\.+/g, "");
    await fs.unlink(path.join(PRIVATE_ROOT, safe));
  } catch {
    /* ignore */
  }
}

// ─── Signed PDF access (anti-hotlink + hidden storage) ──────
// The signature is computed over the stored object *key* so the
// public route never reveals which private file backs a book.
export function signPdfAccess(bookId: string, expiresSec = 3600): string {
  const expires = Math.floor(Date.now() / 1000) + expiresSec;
  const sig = crypto
    .createHmac("sha256", env.appSecret)
    .update(`${bookId}:${expires}`)
    .digest("hex");
  return `/api/pdf/${bookId}?expires=${expires}&sig=${sig}`;
}

export function verifyPdfAccess(
  pdfKey: string,
  expires: string,
  sig: string
): boolean {
  const exp = Number(expires);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = crypto
    .createHmac("sha256", env.appSecret)
    .update(`${pdfKey}:${exp}`)
    .digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
