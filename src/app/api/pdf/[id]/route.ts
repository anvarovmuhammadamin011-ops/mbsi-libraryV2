import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { route } from "@/lib/server/handler";
import { getSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { sanitizeKey, verifyPdfAccess } from "@/lib/server/storage";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

// Secure, signed PDF delivery. The URL is signed (HMAC) and the
// file lives outside /public so it is never directly accessible.
// Access is also gated by authentication + book publish state,
// matching the future S3 "signed URL" architecture.
//
// Muhim: javob HAR DOIM stream qilinadi. Vercel funksiyasi 4.5 MB dan
// katta Buffer javob uchun 413 qaytaradi — bizning PDF larning 154 tasi
// bundan katta. `PDF_PUBLIC_BASE` orqali GitHub Release dan ham stream
// qilinadi (fetch → res.body → Response, buffer'ga yig'ilmaydi).
const PRIVATE_ROOT = path.join(process.cwd(), "storage", "private");

function parseRange(header: string | null, size: number) {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (!m[1] && !m[2])) return null;
  let start: number;
  let end: number;
  if (m[1] === "") {
    const suffix = Number(m[2]);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Number(m[2]);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start > end || start >= size) return null;
  return { start, end: Math.min(end, size - 1) };
}

function pdfHeaders(): Headers {
  return new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": 'inline; filename="book.pdf"',
    "Accept-Ranges": "bytes",
    // 5 daqiqa — imzo 1 soat, lekin qayta so'rov tez bo'lsin
    "Cache-Control": "private, max-age=300",
  });
}

export const GET = route(async (req, ctx) => {
  const user = await getSessionUser();
  if (!user) throw new ApiError(ERROR_CODES.UNAUTHORIZED, "Tizimga kiring", 401);

  const { id } = await ctx.params;
  const expires = req.nextUrl.searchParams.get("expires") ?? "";
  const sig = req.nextUrl.searchParams.get("sig") ?? "";
  if (!verifyPdfAccess(id, expires, sig)) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Yaroqsiz yoki muddati o'tgan havola", 403);
  }

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book || !book.pdfUrl) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, "PDF topilmadi", 404);
  }
  if (!book.isPublished && user.role !== "ADMIN") {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  }

  const key = book.pdfUrl;
  const isRemote = /^https:\/\//i.test(key);

  // 1) Lokal diskda bormi?
  if (!isRemote) {
    const safe = sanitizeKey(key);
    const full = path.join(PRIVATE_ROOT, safe);
    if (full.startsWith(PRIVATE_ROOT)) {
      try {
        const st = await fsp.stat(full);
        if (st.isFile()) {
          const headers = pdfHeaders();
          headers.set("Content-Length", String(st.size));
          const range = parseRange(req.headers.get("range"), st.size);
          if (range) {
            headers.set("Content-Range", `bytes ${range.start}-${range.end}/${st.size}`);
            headers.set("Content-Length", String(range.end - range.start + 1));
          }
          const nodeStream = fs.createReadStream(
            full,
            range ? { start: range.start, end: range.end } : undefined
          );
          const web = Readable.toWeb(nodeStream) as unknown as BodyInit;
          return new Response(web, { status: range ? 206 : 200, headers });
        }
      } catch {
        /* pastdagi zaxira manbaga o'tamiz */
      }
    }
  }

  // 2) Admin tomonidan yuklangan fayl (STORAGE_DRIVER=db/auto → StoredFile)
  const safeKey = isRemote ? "" : sanitizeKey(key);
  if (safeKey) {
    const row = await prisma.storedFile.findUnique({ where: { key: safeKey } });
    if (row?.data) {
      const headers = pdfHeaders();
      headers.set("Content-Type", row.mime || "application/pdf");
      headers.set("Content-Length", String(row.data.byteLength));
      const bytes = Buffer.from(row.data);
      const range = parseRange(req.headers.get("range"), bytes.length);
      if (range) {
        headers.set("Content-Range", `bytes ${range.start}-${range.end}/${bytes.length}`);
        headers.set("Content-Length", String(range.end - range.start + 1));
      }
      const slice = range ? bytes.subarray(range.start, range.end + 1) : bytes;
      return new Response(Readable.toWeb(Readable.from(slice)) as unknown as BodyInit, {
        status: range ? 206 : 200,
        headers,
      });
    }
  }

  // 3) Zaxira manba (GitHub Release / boshqa https manba)
  const upstream = isRemote
    ? key
    : env.pdfPublicBase
      ? `${env.pdfPublicBase.replace(/\/+$/, "")}/${encodeURIComponent(
          path.basename(sanitizeKey(key))
        )}`
      : "";
  if (!upstream) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, "PDF topilmadi", 404);
  }

  const fwd: Record<string, string> = { "User-Agent": "MBSI-Library/1.0" };
  const range = req.headers.get("range");
  if (range) fwd["Range"] = range;

  const upstreamRes = await fetch(upstream, { headers: fwd });
  if (!upstreamRes.ok || !upstreamRes.body) {
    throw new ApiError(
      ERROR_CODES.NOT_FOUND,
      `PDF manbadan olinmadi (${upstreamRes.status})`,
      upstreamRes.status === 404 ? 404 : 502
    );
  }

  const headers = pdfHeaders();
  for (const h of ["content-length", "content-range", "etag", "last-modified"]) {
    const v = upstreamRes.headers.get(h);
    if (v) headers.set(h, v);
  }
  // GitHub `application/octet-stream` + `attachment` qaytaradi —
  // brauzer PDF ni ochishi uchun inline/application/pdf kerak.
  return new Response(upstreamRes.body as unknown as BodyInit, {
    status: upstreamRes.status,
    headers,
  });
});
