import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "./log";

// ──── Storage abstraction ────
// Driver tanlash: STORAGE_DRIVER="s3" (yoki "auto": S3 sozlangan bo'lsa) →
// fayllar S3/R2/MinIO bucket-iga yoziladi. Aks holda DB (StoredFile) ichida
// saqlanadi (serverless uchun ishonchli).
// "auto" — S3 konfiguratsiyasi to'liq bo'lsa S3, aks holda DB.

export type SavedFile = {
  // Public URL ("/api/files/<key>") or a private key ("pdfs/x.pdf").
  urlOrKey: string;
  isPublic: boolean;
  size: number;
};

const ROOT = process.cwd();
const PRIVATE_ROOT = path.join(ROOT, "storage", "private");

export function usesS3(): boolean {
  if (env.storageDriver === "db" || env.storageDriver === "local") return false;
  if (env.storageDriver === "s3") return isS3Configured();
  // auto — S3 to'liq sozlangan bo'lsa
  return isS3Configured();
}

function isS3Configured(): boolean {
  return Boolean(
    env.s3.bucket &&
      env.s3.accessKeyId &&
      env.s3.secretAccessKey &&
      (env.s3.endpoint || env.s3.region)
  );
}

let s3Client: import("@aws-sdk/client-s3").S3Client | null = null;

async function getS3() {
  if (!isS3Configured()) throw new Error("S3_NOT_CONFIGURED");
  if (s3Client) return s3Client;
  const { S3Client } = await import("@aws-sdk/client-s3");
  s3Client = new S3Client({
    region: env.s3.region || "auto",
    endpoint: env.s3.endpoint || undefined,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.s3.accessKeyId,
      secretAccessKey: env.s3.secretAccessKey,
    },
  });
  return s3Client;
}

async function s3Put(key: string, mime: string, buf: Buffer) {
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = await getS3();
  await client.send(
    new PutObjectCommand({
      Bucket: env.s3.bucket,
      Key: key,
      Body: buf,
      ContentType: mime,
    })
  );
}

async function s3Get(key: string): Promise<Buffer | null> {
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const client = await getS3();
  try {
    const res = await client.send(
      new GetObjectCommand({ Bucket: env.s3.bucket, Key: key })
    );
    if (!res.Body) return null;
    const bytes = await res.Body.transformToByteArray();
    return Buffer.from(bytes);
  } catch (e) {
    const code = (e as { name?: string })?.name;
    if (code === "NoSuchKey" || code === "NotFound") return null;
    throw e;
  }
}

async function s3Delete(key: string): Promise<void> {
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const client = await getS3();
  await client.send(
    new DeleteObjectCommand({ Bucket: env.s3.bucket, Key: key })
  );
}

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
  if (usesS3()) {
    await s3Put(key, mime, buf);
    logger.info("storage.s3.upload", "Uploaded object to S3", {
      key,
      size: buf.length,
    });
    return key;
  }
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

export function sanitizeKey(key: string): string {
  return key.replace(/\\/g, "/").replace(/\.\.+/g, "");
}

/** O'qilgan Buffer. Manbalar tartibi: disk → S3 → DB → Error */
export async function readPrivate(key: string): Promise<Buffer> {
  if (key.startsWith("http://") || key.startsWith("https://")) {
    const res = await fetch(key, {
      headers: {
        "User-Agent": "MBSI-Library/1.0",
        Referer: "https://www.ziyouz.com/",
      },
    });
    if (!res.ok) throw new Error("FETCH_FAILED");
    return Buffer.from(await res.arrayBuffer());
  }
  const safe = sanitizeKey(key);
  const full = path.join(PRIVATE_ROOT, safe);
  try {
    return await fs.readFile(full);
  } catch {
    /* continue */
  }
  if (usesS3()) {
    const obj = await s3Get(safe);
    if (obj) return obj;
  }
  const row = await prisma.storedFile.findUnique({ where: { key: safe } });
  if (!row) throw new Error("FILE_NOT_FOUND");
  return Buffer.from(row.data);
}

export async function deleteCover(publicPath: string): Promise<void> {
  try {
    if (publicPath.startsWith("/api/files/")) {
      const key = publicPath.replace("/api/files/", "");
      if (usesS3()) {
        await s3Delete(key).catch(() => {});
        return;
      }
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
  const safe = sanitizeKey(key);
  try {
    if (usesS3()) {
      await s3Delete(safe).catch(() => {});
    } else {
      await prisma.storedFile.deleteMany({ where: { key: safe } }).catch(() => {});
    }
  } catch {
    /* ignore */
  }
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