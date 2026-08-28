import { route, json, readJson } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const POST = route(async (req) => {
  const user = await requireUser();
  if (user.role !== "TEACHER" && user.role !== "ADMIN") throw new ApiError(ERROR_CODES.FORBIDDEN, "Faqat o'qituvchilar uchun", 403);
  const body = await readJson<{ prompt: string }>(req);
  const prompt = body.prompt?.trim();
  if (!prompt || prompt.length < 3) throw new ApiError(ERROR_CODES.VALIDATION, "Qidiruv matni juda qisqa", 400);

  // Simple keyword search across title, description, author, category
  const keywords = prompt.split(/\s+/).filter((w) => w.length > 2);
  const orConditions: any[] = [];
  for (const kw of keywords.slice(0, 5)) {
    orConditions.push({ title: { contains: kw, mode: "insensitive" } });
    orConditions.push({ description: { contains: kw, mode: "insensitive" } });
    orConditions.push({ author: { name: { contains: kw, mode: "insensitive" } } });
    orConditions.push({ category: { name: { contains: kw, mode: "insensitive" } } });
  }

  const books = await prisma.book.findMany({
    where: { isPublished: true, OR: orConditions },
    include: { author: true, category: true },
    take: 6,
  });

  // Fallback if no match: return newest
  const result =
    books.length > 0
      ? books
      : await prisma.book.findMany({
          where: { isPublished: true },
          include: { author: true, category: true },
          orderBy: { createdAt: "desc" },
          take: 6,
        });

  return json({
    success: true,
    data: {
      query: prompt,
      books: result.map((b) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        author: b.author?.name,
        category: b.category?.name,
        coverUrl: b.coverUrl,
        totalPages: b.totalPages,
      })),
      reason: `Sizning so'rovingiz "${prompt}" asosida kutubxonadan mos kitoblar tanlandi.`,
    },
  });
});
