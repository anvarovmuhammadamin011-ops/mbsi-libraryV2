import { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { savePdf, saveCover } from "@/lib/server/storage";
import { createBook } from "@/lib/server/books";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";

const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_COVER_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const user = await requireRole("ADMIN");
  if (!user) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const coverFile = form.get("cover") as File | null;
  const title = String(form.get("title") || "").trim();
  const authorName = String(form.get("author") || "").trim();
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
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    throw new ApiError(ERROR_CODES.INVALID_FILE, "Faqat PDF fayl", 400);
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new ApiError(ERROR_CODES.INVALID_FILE, "PDF hajmi 25 MB dan oshmasligi kerak", 400);
  }
  if (coverFile && coverFile.size > 0 && coverFile.size > MAX_COVER_BYTES) {
    throw new ApiError(ERROR_CODES.INVALID_FILE, "Muqova hajmi 5 MB dan oshmasligi kerak", 400);
  }

  // Resolve category: explicit new name wins, else selected id.
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
      : (
          await prisma.category.create({
            data: { name: newCategoryName, slug },
          })
        ).id;
  }
  if (!categoryId) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Kategoriya tanlang yoki yangi nom yozing", 400);
  }

  // Resolve author (find by name, else create).
  let authorId: string;
  const existing = authorName
    ? await prisma.author.findFirst({ where: { name: authorName } })
    : null;
  if (existing) {
    authorId = existing.id;
  } else {
    const created = await prisma.author.create({
      data: { name: authorName || "Noma'lum" },
    });
    authorId = created.id;
  }

  const saved = await savePdf(file);
  let coverUrl: string | undefined;
  if (coverFile && coverFile.size > 0) {
    const savedCover = await saveCover(coverFile);
    coverUrl = savedCover.urlOrKey;
  }

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

  return success(book, 201);
}
