import { route, json } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

// Split text into logical reading pages (paragraphs grouped into ~2000 char chunks)
function splitIntoPages(text: string, charsPerPage: number = 2000): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const pages: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length + 2 > charsPerPage && current.length > 0) {
      pages.push(current);
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }

  if (current) pages.push(current);
  return pages;
}

export const GET = route(async (req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);

  if (!book.isPublished && user.role !== "ADMIN") {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  }

  const url = new URL(req.url);
  const pageParam = url.searchParams.get("page");
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;

  const content = await prisma.bookContent.findUnique({ where: { bookId: id } });
  if (!content || !content.extractedText) {
    const st = content?.status ?? "pending";
    return json({
      success: true,
      data: {
        text: null,
        totalPages: 0,
        currentPage: page,
        status: st === "needs_ocr" || st === "pending" ? "needs_ocr" : st,
      },
    });
  }

  const pages = splitIntoPages(content.extractedText);
  const totalPages = pages.length;
  const pageText = pages[page - 1] ?? null;

  return json({
    success: true,
    data: {
      text: pageText,
      totalPages,
      currentPage: page,
      status: "completed",
    },
  });
});
