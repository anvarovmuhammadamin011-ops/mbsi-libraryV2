import { route, json, readJson } from "@/lib/server/handler";
import { requireUser, requireAdmin } from "@/lib/server/auth";
import { listBooks, createBook } from "@/lib/server/books";
import { bookQuerySchema } from "@/lib/validation";
import { saveCover, savePdf } from "@/lib/server/storage";
import { validatePdf, validateCover, countPdfPages } from "@/lib/server/pdf";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const GET = route(async (req) => {
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
    return json(
      { success: false, error: { code: ERROR_CODES.VALIDATION, message: "Noto'g'ri parametrlar" } },
      400
    );
  }
  const result = await listBooks(parsed.data);
  return json({
    success: true,
    data: result.data,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

export const POST = route(async (req) => {
  const admin = await requireAdmin();
  const form = await req.formData();
  const title = String(form.get("title") ?? "");
  const description = String(form.get("description") ?? "");
  const authorId = String(form.get("authorId") ?? "");
  const categoryId = String(form.get("categoryId") ?? "");
  const language = String(form.get("language") ?? "UZ");
  const isPublished = form.get("isPublished") === "true" || form.get("isPublished") === "on";

  const coverFile = form.get("cover");
  const pdfFile = form.get("pdf");

  if (!(pdfFile instanceof File)) {
    throw new ApiError(ERROR_CODES.INVALID_FILE, "PDF fayl majburiy", 400);
  }
  if (!(coverFile instanceof File)) {
    throw new ApiError(ERROR_CODES.INVALID_FILE, "Muqova rasmi majburiy", 400);
  }

  const pdfBuf = Buffer.from(await pdfFile.arrayBuffer());
  validatePdf(pdfBuf, pdfFile.type, pdfFile.name);
  const totalPages = countPdfPages(pdfBuf);

  const coverBuf = Buffer.from(await coverFile.arrayBuffer());
  validateCover(coverBuf, coverFile.type, coverFile.name);

  const [cover, pdf] = await Promise.all([
    saveCover(coverFile),
    savePdf(pdfFile),
  ]);

  const book = await createBook({
    title,
    description,
    authorId,
    categoryId,
    language,
    isPublished,
    coverUrl: cover.urlOrKey,
    pdfUrl: pdf.urlOrKey,
    totalPages,
    fileSize: pdf.size,
    userId: admin.id,
  });

  return json({ success: true, data: book }, 201);
});
