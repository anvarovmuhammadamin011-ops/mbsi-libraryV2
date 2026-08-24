import { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { savePdf } from "@/lib/server/storage";
import { createBook } from "@/lib/server/books";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";

export async function POST(req: NextRequest) {
  const user = await requireRole("ADMIN");
  if (!user) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const title = String(form.get("title") || "").trim();
  const authorName = String(form.get("author") || "").trim();
  const categoryId = String(form.get("categoryId") || "") || null;
  const totalPages = Math.max(1, Number(form.get("totalPages")) || 1);

  if (!file || !title) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Sarlavha va PDF fayl kerak", 400);
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new ApiError(ERROR_CODES.INVALID_FILE, "Faqat PDF fayl", 400);
  }
  if (!categoryId) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Kategoriya tanlang", 400);
  }

  // Resolve author (find by name, else create).
  let authorId: string;
  const existing = await prisma.author.findFirst({ where: { name: authorName } });
  if (existing) {
    authorId = existing.id;
  } else {
    const created = await prisma.author.create({ data: { name: authorName || "Noma'lum" } });
    authorId = created.id;
  }

  const saved = await savePdf(file);
  const book = await createBook({
    title,
    authorId,
    categoryId,
    language: "UZ",
    isPublished: true,
    pdfUrl: saved.urlOrKey,
    totalPages,
    fileSize: saved.size,
    userId: user.id,
  });

  return success(book, 201);
}
