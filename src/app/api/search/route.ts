import { route, json } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { listBooks } from "@/lib/server/books";
import { bookQuerySchema } from "@/lib/validation";

export const GET = route(async (req) => {
  await requireUser();
  const sp = req.nextUrl.searchParams;
  const parsed = bookQuerySchema.safeParse({
    q: sp.get("q") ?? undefined,
    language: sp.get("language") ?? undefined,
    categoryId: sp.get("categoryId") ?? undefined,
    authorId: sp.get("authorId") ?? undefined,
    rating: sp.get("rating") ?? undefined,
    sort: sp.get("sort") ?? "newest",
    page: sp.get("page") ?? "1",
    pageSize: sp.get("pageSize") ?? "20",
    publishedOnly: true,
  });
  if (!parsed.success) {
    return json({ success: true, data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });
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
