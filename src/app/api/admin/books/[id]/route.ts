import { route } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { updateBook, deleteBook } from "@/lib/server/books";
import { deletePrivate, deleteCover, saveCover } from "@/lib/server/storage";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";
import { prisma } from "@/lib/db";

async function resolveAuthor(name: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) throw new ApiError(ERROR_CODES.VALIDATION, "Muallif nomi kerak", 400);
  const existing = await prisma.author.findFirst({ where: { name: trimmed } });
  if (existing) return existing.id;
  return (await prisma.author.create({ data: { name: trimmed } })).id;
}

export const PATCH = route(async (req, ctx) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const { id } = await ctx.params;
  const form = await req.formData();

  const data: {
    title?: string;
    description?: string;
    authorId?: string;
    categoryId?: string;
    language?: string;
    isPublished?: boolean;
    totalPages?: number;
    coinReward?: number;
    coverUrl?: string;
  } = {};

  if (form.get("title") !== null) data.title = String(form.get("title"));
  if (form.get("description") !== null) data.description = String(form.get("description"));
  const authorName = form.get("author");
  if (authorName !== null && String(authorName).trim()) {
    data.authorId = await resolveAuthor(String(authorName));
  } else if (form.get("authorId")) {
    data.authorId = String(form.get("authorId"));
  }
  if (form.get("categoryId")) data.categoryId = String(form.get("categoryId"));
  if (form.get("language")) data.language = String(form.get("language"));
  if (form.get("isPublished") !== null) data.isPublished = form.get("isPublished") === "true";
  if (form.get("totalPages") !== null && String(form.get("totalPages")) !== "") {
    data.totalPages = Number(form.get("totalPages"));
  }
  if (form.get("coinReward") !== null && String(form.get("coinReward")) !== "") {
    data.coinReward = Number(form.get("coinReward"));
  }

  // Optional new cover upload.
  const coverFile = form.get("cover") as File | null;
  if (coverFile && coverFile.size > 0) {
    const saved = await saveCover(coverFile);
    const existing = await prisma.book.findUnique({ where: { id }, select: { coverUrl: true } });
    if (existing?.coverUrl) await deleteCover(existing.coverUrl);
    data.coverUrl = saved.urlOrKey;
  }

  const book = await updateBook(id, { ...data, userId: admin.id });

  // Save book content text if provided
  const contentText = form.get("contentText");
  if (contentText !== null) {
    const text = String(contentText).trim();
    if (text) {
      await prisma.bookContent.upsert({
        where: { bookId: id },
        create: {
          bookId: id,
          extractedText: text,
          status: "completed",
        },
        update: {
          extractedText: text,
          status: "completed",
        },
      });
    } else {
      // If text is empty, delete existing content
      await prisma.bookContent.deleteMany({ where: { bookId: id } });
    }
  }

  return success(book);
});

export const DELETE = route(async (req, ctx) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const { id } = await ctx.params;
  const existing = await prisma.book.findUnique({ where: { id } });
  await deleteBook(id, admin.id);
  if (existing?.pdfUrl) await deletePrivate(existing.pdfUrl);
  if (existing?.coverUrl) await deleteCover(existing.coverUrl);
  return success({ id });
});
