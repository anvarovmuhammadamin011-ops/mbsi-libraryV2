import { route } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { updateBook, deleteBook } from "@/lib/server/books";
import { deletePrivate } from "@/lib/server/storage";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";
import { prisma } from "@/lib/db";

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
  } = {};

  if (form.get("title") !== null) data.title = String(form.get("title"));
  if (form.get("description") !== null) data.description = String(form.get("description"));
  if (form.get("authorId")) data.authorId = String(form.get("authorId"));
  if (form.get("categoryId")) data.categoryId = String(form.get("categoryId"));
  if (form.get("language")) data.language = String(form.get("language"));
  if (form.get("isPublished") !== null) data.isPublished = form.get("isPublished") === "true";
  if (form.get("totalPages") !== null) data.totalPages = Number(form.get("totalPages"));

  const book = await updateBook(id, { ...data, userId: admin.id });
  return success(book);
});

export const DELETE = route(async (req, ctx) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const { id } = await ctx.params;
  const existing = await prisma.book.findUnique({ where: { id } });
  await deleteBook(id, admin.id);
  if (existing?.pdfUrl) await deletePrivate(existing.pdfUrl);
  return success({ id });
});
