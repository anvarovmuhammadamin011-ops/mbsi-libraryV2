import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

// ──── Storage abstraction ────
// Runtime uploads are stored IN THE DATABASE (StoredFile table) so
// they work on read-only serverless hosts like Vercel. Files that
// ship with the repo (seeded PDFs under storage/private) are still
// read straight from disk, with a DB fallback.

const ROOT = process.cwd();
const PUBLIC_UPLOADS = path.join(ROOT, "public", "uploads");
const PRIVATE_ROOT = path.join(ROOT, "storage", "private");

export type SavedFile = {
  // Public URL ("/api/files/<key>") or a private key ("pdfs/x.pdf").
  urlOrKey: string;
  isPublic: boolean;
  size: number;
};

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function putDbFile(
  prefix: string,
  ext: string,
  mime: string,
  buf: Buffer
): Promise<string> {
  const key = `${prefix}/${crypto.randomBytes(12).toString("hex")}.${ext}`;
  await prisma.storedFile.create({
    data: { key, mime, size: buf.length, data: new Uint8Array(buf) },
  });
  return key;
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
  const buf = Buffer.from(await file.arrayBuffer());
  const key = await putDbFile("covers", ext, COVER_TYPES[ext], buf);
  return { urlOrKey: `/api/files/${key}`, isPublic: true, size: buf.length };
}

export async function savePdf(file: File): Promise<SavedFile> {
  const ext = extOf(file.name, "pdf");
  if (ext !== "pdf") throw new Error("INVALID_PDF_TYPE");
  const buf = Buffer.from(await file.arrayBuffer());
  const key = await putDbFile("pdfs", "pdf", "application/pdf", buf);
  return { urlOrKey: key, isPublic: false, size: buf.length };
}

export async function readPrivate(key: string): Promise<Buffer> {
  if (key.startsWith("http://") || key.startsWith("https://")) {
    const res = await fetch(key, { headers: { "User-Agent": "MBSI-Library/1.0", Referer: "https://www.ziyouz.com/" } });
    if (!res.ok) throw new Error("FETCH_FAILED");
    return Buffer.from(await res.arrayBuffer());
  }
  const safe = key.replace(/\\/g, "/").replace(/\.\.+/g, "");
  const full = path.join(PRIVATE_ROOT, safe);
  try {
    return await fs.readFile(full);
  } catch {
    // Fall back to the database (runtime uploads).
    const row = await prisma.storedFile.findUnique({ where: { key: safe } });
    if (!row) throw new Error("FILE_NOT_FOUND");
    return Buffer.from(row.data);
  }
}

export async function deleteCover(publicPath: string): Promise<void> {
  try {
    if (publicPath.startsWith("/api/files/")) {
      const key = publicPath.replace("/api/files/", "");
      await prisma.storedFile.delete({ where: { key } }).catch(() => {});
      return;
    }
    const full = path.join(ROOT, publicPath.replace(/^\//, ""));
    await fs.unlink(full);
  } catch {
    /* ignore */
  }
}

export async function deletePrivate(key: string): Promise<void> {
  const safe = key.replace(/\\/g, "/").replace(/\.\.+/g, "");
  await prisma.storedFile.deleteMany({ where: { key: safe } }).catch(() => {});
  try {
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
