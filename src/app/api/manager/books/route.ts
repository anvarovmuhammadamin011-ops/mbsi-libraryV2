import { NextRequest } from "next/server";
import { requireBookManager } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { savePdf, saveCover } from "@/lib/server/storage";
import { createBook, bookInclude, toApiBook, getBookStats } from "@/lib/server/books";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";

const MAX_PDF_BYTES = 25 * 1024 * 1024;
const MAX_COVER_BYTES = 5 * 1024 * 1024;

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
  } catch {
    return fallback;
  }
}

export async function GET() {
  const user = await requireBookManager();

  const books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      ...bookInclude,
      _count: { select: { ratings: true, progress: true } },
    },
    take: 200,
  });

  const ids = books.map((b) => b.id);
  const stats = await getBookStats(ids);

  const data = books.map((b) => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    authorName: b.author?.name ?? "-",
    categoryName: b.category?.name ?? "-",
    description: b.description ?? "",
    language: b.language,
    totalPages: b.totalPages,
    isPublished: b.isPublished,
    readerCount: b._count.progress,
    ratingCount: b._count.ratings,
    averageRating: stats[b.id]?.avg ?? null,
    createdAt: b.createdAt.toISOString(),
    coverUrl: b.coverUrl ?? "",
  }));

  return success(data);
}

export async function POST(req: NextRequest) {
  const user = await requireBookManager();

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const coverFile = form.get("cover") as File | null;
  const title = String(form.get("title") || "").trim();
  const authorName = String(form.get("author") || "")
    .trim()
    .replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
  const description = String(form.get("description") || "").trim();
  const language = ["UZ", "RU", "EN"].includes(String(form.get("language")))
    ? String(form.get("language"))
    : "UZ";
  const categoryIdInput = String(form.get("categoryId") || "").trim();
  const newCategoryName = String(form.get("newCategory") || "").trim();
  const totalPages = Math.max(1, Number(form.get("totalPages")) || 1);
  const isPublished = String(form.get("isPublished") || "true") !== "false";

  if (!file || !title) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Sarlavha va PDF fayl kerak", 400);
  }
  if (!authorName) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Muallif ismini kiriting", 400);
  }
  if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(authorName)) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Muallif ismi faqat harflardan iborat bo'lishi kerak", 400);
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new ApiError(ERROR_CODES.INVALID_FILE, "Faqat PDF fayl", 400);
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new ApiError(ERROR_CODES.INVALID_FILE, "PDF hajmi 25 MB dan oshmasligi kerak", 400);
  }
  if (coverFile && coverFile.size > 0 && coverFile.size > MAX_COVER_BYTES) {
    throw new ApiError(ERROR_CODES.INVALID_FILE, "Muqova hajmi 5 MB dan oshmasligi kerak", 400);
  }

  let categoryId = categoryIdInput || null;
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
    categoryId = existingCat
      ? existingCat.id
      : (await prisma.category.create({ data: { name: newCategoryName, slug } })).id;
  }
  if (!categoryId) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Kategoriya tanlang yoki yangi nom yozing", 400);
  }

  let authorId: string;
  const existing = authorName
    ? await prisma.author.findFirst({ where: { name: authorName } })
    : null;
  if (existing) {
    authorId = existing.id;
  } else {
    const created = await prisma.author.create({ data: { name: authorName } });
    authorId = created.id;
  }

  const saved = await savePdf(file);
  let coverUrl: string | undefined;
  if (coverFile && coverFile.size > 0) {
    const savedCover = await saveCover(coverFile);
    coverUrl = savedCover.urlOrKey;
  }

  const pdfBuffer = Buffer.from(await file.arrayBuffer());
  const detectedPages = await detectPageCount(pdfBuffer, totalPages);

  const book = await createBook({
    title,
    description,
    authorId,
    categoryId,
    language,
    isPublished,
    coverUrl,
    pdfUrl: saved.urlOrKey,
    totalPages: detectedPages,
    fileSize: saved.size,
    userId: user.id,
  });

  return success(book, 201);
}
