import type { NextRequest } from "next/server";
import { requireUser, requireBookManager } from "./auth";
import {
  listBooks,
  createBook,
  updateBook,
  deleteBook,
  getBookById,
  slugify,
} from "./books";
import { bookQuerySchema } from "@/lib/validation";
import { saveCover, savePdf, deleteCover, deletePrivate } from "./storage";
import { validateCover, countPdfPages } from "./pdf";
import {
  ApiError,
  ERROR_CODES,
  success,
  paginated,
  fail,
} from "./errors";
import { prisma } from "@/lib/db";

// ─── Yangi kitoblar API'si (/api/books-v2) ───────────────────
// Quyidagi handler'lar yangi API route'lari va eski endpointlar
// (/api/books, /api/manager/books, /api/admin/upload) orqali bir
// xil mantığın ishlatadi — kod takrorlanmaydi, javob formati bir
// xil qoladi.

export type RouteCtx = { params: Promise<Record<string, string>> };

const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_COVER_BYTES = 5 * 1024 * 1024; // 5 MB
const COVER_EXT = /\.(jpe?g|png|webp|gif)$/i;
const LANGS = ["UZ", "RU", "EN"];

// PDF sahifalar sonini PDFJS orqali aniqlaydi; o'qib bo'lmasa
// regex-ga asoslangan countPdfPages()'ga tushadi.
async function detectPageCount(buf: Buffer, fallback: number): Promise<number> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(buf),
      isEvalSupported: false,
      useSystemFonts: false,
    }).promise;
    const n = doc.numPages;
    await doc.destroy();
    return n > 0 ? n : fallback;
  } catch (err) {
    console.error("PDF page count detection failed:", err);
    return fallback;
  }
}

// PDF faylni tekshirib, bufferini qaytaradi (majburiy uchun).
async function readValidatedPdf(file: File | null): Promise<Buffer> {
  if (!(file instanceof File) || file.size === 0) {
    throw new ApiError(ERROR_CODES.INVALID_FILE, "PDF fayl majburiy", 400);
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new ApiError(
      ERROR_CODES.INVALID_FILE,
      "PDF hajmi 25 MB dan oshmasligi kerak",
      400
    );
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const header = buf.subarray(0, 5).toString("latin1") === "%PDF-";
  const ext = file.name.toLowerCase().endsWith(".pdf");
  const mime = file.type === "application/pdf";
  if ((!ext && !mime) || !header) {
    throw new ApiError(
      ERROR_CODES.INVALID_FILE,
      "Faqat PDF fayl yuklash mumkin",
      400
    );
  }
  return buf;
}

// Muqova rasmni tekshiradi (save qilishdan oldin chaqiriladi).
async function assertCover(file: File): Promise<void> {
  if (file.size > MAX_COVER_BYTES) {
    throw new ApiError(
      ERROR_CODES.INVALID_FILE,
      "Muqova hajmi 5 MB dan oshmasligi kerak",
      400
    );
  }
  const buf = Buffer.from(await file.arrayBuffer());
  validateCover(buf, file.type, file.name);
  // saveCover() SVG'ni qabul qilmaydi — oldindan tekshiramiz.
  if (!COVER_EXT.test(file.name)) {
    throw new ApiError(
      ERROR_CODES.INVALID_FILE,
      "Faqat rasm fayl yuklash mumkin (JPG, PNG, WEBP, GIF)",
      400
    );
  }
}

async function resolveAuthorId(name: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Muallif nomi kerak", 400);
  }
  const existing = await prisma.author.findFirst({ where: { name: trimmed } });
  if (existing) return existing.id;
  return (await prisma.author.create({ data: { name: trimmed } })).id;
}

// Yangi kitob: muallif (id yoki nomi) va kategoriya (id yoki yangi
// nomi) ni qo'llab-quvvatlaydi — shu bilan eski ikkala POST
// (/api/books va /api/manager/books) bitta yaratuvchida birlashadi.
async function resolveCategory(form: FormData): Promise<string> {
  const categoryId = String(form.get("categoryId") || "").trim();
  const newCategoryName = String(form.get("newCategory") || "").trim();
  if (newCategoryName) {
    const slug =
      newCategoryName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-") || `cat-${Date.now()}`;
    const existingCat = await prisma.category.findFirst({
      where: { name: newCategoryName },
    });
    return existingCat
      ? existingCat.id
      : (await prisma.category.create({ data: { name: newCategoryName, slug } }))
          .id;
  }
  if (!categoryId) {
    throw new ApiError(
      ERROR_CODES.VALIDATION,
      "Kategoriya tanlang yoki yangi nom yozing",
      400
    );
  }
  const cat = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!cat) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Kategoriya topilmadi", 400);
  }
  return categoryId;
}

// ─── GET /api/books-v2 ───────────────────────────────────────
export async function handleBookList(req: NextRequest) {
  await requireUser();
  const sp = req.nextUrl.searchParams;
  const parsed = bookQuerySchema.safeParse({
    q: sp.get("q") ?? undefined,
    language: sp.get("language") ?? undefined,
    categoryId: sp.get("categoryId") ?? undefined,
    authorId: sp.get("authorId") ?? undefined,
    rating: sp.get("rating") ?? undefined,
    sort: sp.get("sort") ?? undefined,
    page: sp.get("page") ?? undefined,
    pageSize: sp.get("pageSize") ?? undefined,
    publishedOnly: sp.get("publishedOnly") !== "false",
  });
  if (!parsed.success) {
    return fail(ERROR_CODES.VALIDATION, "Noto'g'ri parametrlar", 400);
  }
  const result = await listBooks(parsed.data);
  return paginated(result.data, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
  });
}

// ─── POST /api/books-v2 ──────────────────────────────────────
export async function handleBookCreate(req: NextRequest) {
  const user = await requireBookManager();
  const form = await req.formData();

  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  const language = LANGS.includes(String(form.get("language")))
    ? String(form.get("language"))
    : "UZ";
  const isPublished = String(form.get("isPublished") || "true") !== "false";
  const authorIdInput = String(form.get("authorId") || "").trim();
  const authorName = String(form.get("author") || "")
    .trim()
    .replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
  const enteredPages = Math.max(1, Number(form.get("totalPages")) || 1);

  // Ikkala eski shakl ham qo'llab-quvvatlanadi: "file" (menejer)
  // va "pdf" (admin).
  const pdfFile = (form.get("file") ?? form.get("pdf")) as File | null;
  const coverFile = form.get("cover") as File | null;

  if (!title) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Sarlavha va PDF fayl kerak", 400);
  }
  const pdfBuf = await readValidatedPdf(pdfFile);

  let authorId: string;
  if (authorIdInput) {
    const author = await prisma.author.findUnique({
      where: { id: authorIdInput },
    });
    if (!author) {
      throw new ApiError(ERROR_CODES.VALIDATION, "Muallif topilmadi", 400);
    }
    authorId = author.id;
  } else {
    if (!authorName) {
      throw new ApiError(ERROR_CODES.VALIDATION, "Muallif ismini kiriting", 400);
    }
    if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(authorName)) {
      throw new ApiError(
        ERROR_CODES.VALIDATION,
        "Muallif ismi faqat harflardan iborat bo'lishi kerak",
        400
      );
    }
    authorId = await resolveAuthorId(authorName);
  }

  const categoryId = await resolveCategory(form);
  const hasCover = Boolean(coverFile && coverFile.size > 0);
  if (hasCover && coverFile) await assertCover(coverFile);

  const saved = await savePdf(pdfFile!);
  const coverUrl = hasCover && coverFile ? (await saveCover(coverFile)).urlOrKey : undefined;
  const totalPages = await detectPageCount(pdfBuf, countPdfPages(pdfBuf));

  const book = await createBook({
    title,
    description,
    authorId,
    categoryId,
    language,
    isPublished,
    coverUrl,
    pdfUrl: saved.urlOrKey,
    totalPages,
    fileSize: saved.size,
    userId: user.id,
  });

  // Nashr etilgan yangi kitob haqida o'quvchilarga xabar berish.
  if (isPublished) {
    try {
      const { getNotifiableUserIds, notifyUsers } = await import("@/lib/server/push");
      const userIds = await getNotifiableUserIds(user.id);
      if (userIds.length) {
        await notifyUsers(userIds, {
          type: "book",
          title: "Kutubxonaga yangi kitob qo'shildi",
          body: book.title,
          url: `/books/${book.slug ?? ""}`,
        });
      }
    } catch (e) {
      console.error("[books-v2] bildirishnoma yuborilmadi:", (e as Error).message);
    }
  }

  return success(book, 201);
}

// ─── GET /api/books-v2/[id] ──────────────────────────────────
export async function handleBookGet(_req: NextRequest, ctx: RouteCtx) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const book = await getBookById(id);
  if (!book) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);
  // Yashirilgan/qoralama kitoblar faqat ADMIN va BOOK_MANAGER uchun
  const canSeeHidden = user.role === "ADMIN" || user.role === "BOOK_MANAGER";
  const isHiddenOrDraft =
    !book.isPublished || book.status === "HIDDEN" || book.status === "DRAFT";
  if (!canSeeHidden && isHiddenOrDraft) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);
  }
  return success(book);
}

// ─── PATCH /api/books-v2/[id] ────────────────────────────────
export async function handleBookPatch(req: NextRequest, ctx: RouteCtx) {
  const user = await requireBookManager();
  const { id } = await ctx.params;
  const form = await req.formData();

  const existing = await prisma.book.findUnique({ where: { id } });
  if (!existing) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);

  const data: {
    title?: string;
    description?: string;
    authorId?: string;
    categoryId?: string;
    language?: string;
    isPublished?: boolean;
    totalPages?: number;
    coverUrl?: string;
    pdfUrl?: string;
    fileSize?: number;
    userId: string;
  } = { userId: user.id };

  if (form.get("title") !== null) data.title = String(form.get("title"));
  if (form.get("description") !== null)
    data.description = String(form.get("description"));
  if (form.get("language")) data.language = String(form.get("language"));
  if (form.get("isPublished") !== null)
    data.isPublished = form.get("isPublished") === "true";
  if (form.get("totalPages") !== null && String(form.get("totalPages")) !== "") {
    const n = Number(form.get("totalPages"));
    if (Number.isFinite(n) && n > 0) data.totalPages = n;
  }
  if (form.get("categoryId")) data.categoryId = String(form.get("categoryId"));

  // Muallif: nom (menejer shakli) yoki tayyor id (admin shakli).
  const authorName = form.get("author");
  if (authorName !== null && String(authorName).trim()) {
    data.authorId = await resolveAuthorId(String(authorName));
  } else if (form.get("authorId")) {
    data.authorId = String(form.get("authorId"));
  }

  const coverFile = form.get("cover") as File | null;
  if (coverFile && coverFile.size > 0) {
    await assertCover(coverFile);
    data.coverUrl = (await saveCover(coverFile)).urlOrKey;
    if (existing.coverUrl) await deleteCover(existing.coverUrl);
  }

  const pdfFile = (form.get("pdf") ?? form.get("file")) as File | null;
  if (pdfFile && pdfFile.size > 0) {
    const buf = await readValidatedPdf(pdfFile);
    const saved = await savePdf(pdfFile);
    data.pdfUrl = saved.urlOrKey;
    data.fileSize = saved.size;
    data.totalPages = await detectPageCount(buf, countPdfPages(buf));
    if (existing.pdfUrl) await deletePrivate(existing.pdfUrl);
  }

  const book = await updateBook(id, data);
  return success(book);
}

// ─── DELETE /api/books-v2/[id] ───────────────────────────────
export async function handleBookDelete(_req: NextRequest, ctx: RouteCtx) {
  const user = await requireBookManager();
  const { id } = await ctx.params;
  const existing = await prisma.book.findUnique({ where: { id } });
  await deleteBook(id, user.id);
  if (existing?.coverUrl) await deleteCover(existing.coverUrl);
  if (existing?.pdfUrl) await deletePrivate(existing.pdfUrl);
  return success({ id });
}

// ─── POST /api/books-v2/sync ─────────────────────────────────
// Eski /api/books API'sidagi barcha kitoblarni (yashirilganlar
// ham) olib kelib, slug bo'yicha yangi API bazasiga moslashtiradi.
// Iddao idempotent: mavjud kitoblar o'zgartirilmaydi.
export async function handleBookSync() {
  await requireBookManager();

  const pageSize = 50;
  let page = 1;
  let sourceTotal = 0;
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let failed = 0;

  for (let guard = 0; guard < 1000; guard++) {
    const res = await listBooks(
      {
        q: undefined,
        language: undefined,
        categoryId: undefined,
        authorId: undefined,
        rating: undefined,
        sort: "newest",
        page,
        pageSize,
        publishedOnly: false,
      },
      { includeUnpublished: true }
    );
    sourceTotal = res.total;

    for (const b of res.data) {
      const slug = b.slug || slugify(b.title);
      const existing = await prisma.book.findUnique({ where: { slug } });
      if (!existing) {
        try {
          await prisma.book.create({
            data: {
              title: b.title,
              slug,
              description: b.description || null,
              coverUrl: b.coverUrl || null,
              pdfUrl: b.pdfUrl || null,
              language: b.language,
              totalPages: b.totalPages,
              fileSize: b.fileSize || null,
              authorId: b.authorId,
              categoryId: b.categoryId,
              isPublished: b.isPublished,
              status: b.status ?? "ACTIVE",
            },
          });
          created += 1;
        } catch (e) {
          failed += 1;
          console.error("[books-v2/sync] yaratib bo'lmadi:", (e as Error).message);
        }
        continue;
      }

      const status = b.status ?? "ACTIVE";
      const same =
        existing.title === b.title &&
        (existing.description ?? "") === (b.description ?? "") &&
        (existing.coverUrl ?? "") === (b.coverUrl || "") &&
        (existing.pdfUrl ?? "") === (b.pdfUrl || "") &&
        existing.language === b.language &&
        existing.totalPages === b.totalPages &&
        (existing.fileSize ?? 0) === (b.fileSize ?? 0) &&
        existing.isPublished === b.isPublished &&
        existing.status === status &&
        existing.authorId === b.authorId &&
        existing.categoryId === b.categoryId;

      if (same) {
        unchanged += 1;
      } else {
        try {
          await prisma.book.update({
            where: { id: existing.id },
            data: {
              title: b.title,
              description: b.description || null,
              coverUrl: b.coverUrl || null,
              pdfUrl: b.pdfUrl || null,
              language: b.language,
              totalPages: b.totalPages,
              fileSize: b.fileSize || null,
              authorId: b.authorId,
              categoryId: b.categoryId,
              isPublished: b.isPublished,
              status,
            },
          });
          updated += 1;
        } catch (e) {
          failed += 1;
          console.error("[books-v2/sync] yangilab bo'lmadi:", (e as Error).message);
        }
      }
    }

    if (page >= res.totalPages) break;
    page += 1;
  }

  return success({
    source: "/api/books",
    total: sourceTotal,
    created,
    updated,
    unchanged,
    failed,
    syncedAt: new Date().toISOString(),
  });
}
