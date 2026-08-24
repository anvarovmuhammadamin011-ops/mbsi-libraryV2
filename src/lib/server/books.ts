import { prisma } from "@/lib/db";
import type { Prisma, Banner } from "@prisma/client";
import { env } from "@/lib/env";
import { ApiError, ERROR_CODES } from "./errors";
import { logAudit } from "./audit";
import type { BookQuery } from "@/lib/validation";
import type { Book, Language } from "@/types";

export const bookInclude = {
  author: true,
  category: true,
} satisfies Prisma.BookInclude;

export type BookRow = Prisma.BookGetPayload<{ include: typeof bookInclude }>;

export type BookStat = { avg: number; count: number; readers: number };

const insensitive =
  !env.isSqlite ? ({ mode: "insensitive" as const }) : ({} as object);

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return base || "book";
}

export async function getBookStats(
  ids: string[]
): Promise<Record<string, BookStat>> {
  if (ids.length === 0) return {};
  const [ratings, readers] = await Promise.all([
    prisma.rating.groupBy({
      by: ["bookId"],
      where: { bookId: { in: ids } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.readingProgress.groupBy({
      by: ["bookId"],
      where: { bookId: { in: ids } },
      _count: { _all: true },
    }),
  ]);
  const map: Record<string, BookStat> = {};
  for (const id of ids) map[id] = { avg: 0, count: 0, readers: 0 };
  for (const r of ratings) {
    map[r.bookId] = {
      ...map[r.bookId],
      avg: Math.round((r._avg.rating ?? 0) * 100) / 100,
      count: r._count._all,
    };
  }
  for (const r of readers) {
    map[r.bookId] = { ...map[r.bookId], readers: r._count._all };
  }
  return map;
}

export function toApiBook(row: BookRow, stat?: BookStat): Book {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    coverUrl: row.coverUrl ?? "",
    pdfUrl: row.pdfUrl ?? "",
    language: row.language as Language,
    totalPages: row.totalPages,
    fileSize: row.fileSize ?? 0,
    authorId: row.authorId,
    author: row.author
      ? {
          id: row.author.id,
          name: row.author.name,
          biography: row.author.biography ?? undefined,
          avatar: row.author.avatar ?? undefined,
          createdAt: row.author.createdAt.toISOString(),
        }
      : undefined,
    categoryId: row.categoryId,
    category: row.category
      ? {
          id: row.category.id,
          name: row.category.name,
          slug: row.category.slug,
          description: row.category.description ?? undefined,
          createdAt: row.category.createdAt.toISOString(),
        }
      : undefined,
    isPublished: row.isPublished,
    averageRating: stat?.avg ?? 0,
    ratingCount: stat?.count ?? 0,
    readerCount: stat?.readers ?? 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listBooks(
  query: BookQuery,
  opts?: { includeUnpublished?: boolean }
) {
  const {
    q,
    language,
    categoryId,
    authorId,
    rating,
    sort,
    page,
    pageSize,
    publishedOnly,
  } = query;

  const baseWhere: Prisma.BookWhereInput = {};
  if (publishedOnly && !opts?.includeUnpublished) baseWhere.isPublished = true;
  if (language) baseWhere.language = language;
  if (categoryId) baseWhere.categoryId = categoryId;
  if (authorId) baseWhere.authorId = authorId;

  if (q && q.trim()) {
    if (env.meiliHost) {
      const { searchBookIds } = await import("./search");
      const ids = await searchBookIds(q);
      if (ids && ids.length > 0) {
        baseWhere.id = { in: ids };
      } else if (ids && ids.length === 0) {
        return { data: [], total: 0, totalPages: 1, page: 1, pageSize };
      }
    } else {
      baseWhere.OR = [
        { title: { contains: q, ...insensitive } },
        { description: { contains: q, ...insensitive } },
        { author: { name: { contains: q, ...insensitive } } },
        { category: { name: { contains: q, ...insensitive } } },
      ];
    }
  }

  const candidates = await prisma.book.findMany({
    where: baseWhere,
    select: { id: true },
  });
  const ids = candidates.map((c) => c.id);
  const stats = await getBookStats(ids);

  let filtered = ids;
  if (rating) {
    filtered = ids.filter((id) => (stats[id]?.avg ?? 0) >= rating!);
  }

  let sorted = filtered;
  if (sort === "rating") {
    sorted = [...filtered].sort(
      (a, b) => (stats[b]?.avg ?? 0) - (stats[a]?.avg ?? 0)
    );
  } else if (sort === "popular") {
    sorted = [...filtered].sort(
      (a, b) => (stats[b]?.readers ?? 0) - (stats[a]?.readers ?? 0)
    );
  }

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  let pageIds: string[];
  if (sort === "newest" || sort === "pages") {
    const orderBy =
      sort === "pages"
        ? { totalPages: "desc" as const }
        : { createdAt: "desc" as const };
    const dbSorted = await prisma.book.findMany({
      where: { id: { in: sorted } },
      select: { id: true },
      orderBy,
    });
    pageIds = dbSorted
      .map((b) => b.id)
      .slice((safePage - 1) * pageSize, safePage * pageSize);
  } else {
    pageIds = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  }

  const rows = await prisma.book.findMany({
    where: { id: { in: pageIds } },
    include: bookInclude,
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ordered = pageIds
    .map((id) => byId.get(id))
    .filter((r): r is BookRow => Boolean(r));
  const data = ordered.map((r) => toApiBook(r, stats[r.id]));

  return { data, total, totalPages, page: safePage, pageSize };
}

export async function getBookById(id: string) {
  const row = await prisma.book.findUnique({ where: { id }, include: bookInclude });
  if (!row) return null;
  const stats = await getBookStats([row.id]);
  return toApiBook(row, stats[row.id]);
}

export async function getBookBySlug(slug: string) {
  const row = await prisma.book.findUnique({
    where: { slug },
    include: bookInclude,
  });
  if (!row) return null;
  const stats = await getBookStats([row.id]);
  return toApiBook(row, stats[row.id]);
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let n = 1;
  while (await prisma.book.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function createBook(params: {
  title: string;
  description?: string;
  authorId: string;
  categoryId: string;
  language: string;
  isPublished: boolean;
  coverUrl?: string;
  pdfUrl?: string;
  totalPages: number;
  fileSize?: number;
  userId: string;
}) {
  const slug = await uniqueSlug(params.title);
  const book = await prisma.book.create({
    data: {
      title: params.title,
      slug,
      description: params.description || null,
      authorId: params.authorId,
      categoryId: params.categoryId,
      language: params.language,
      isPublished: params.isPublished,
      coverUrl: params.coverUrl || null,
      pdfUrl: params.pdfUrl || null,
      totalPages: params.totalPages,
      fileSize: params.fileSize ?? null,
    },
    include: bookInclude,
  });
  await logAudit({
    userId: params.userId,
    action: "CREATE_BOOK",
    entity: "Book",
    entityId: book.id,
    metadata: { title: book.title, published: book.isPublished },
  });
  if (env.meiliHost) {
    const { indexBook } = await import("./search");
    await indexBook(book);
  }
  const stats = await getBookStats([book.id]);
  return toApiBook(book, stats[book.id]);
}

export async function updateBook(
  id: string,
  params: {
    title?: string;
    description?: string;
    authorId?: string;
    categoryId?: string;
    language?: string;
    isPublished?: boolean;
    coverUrl?: string;
    pdfUrl?: string;
    totalPages?: number;
    fileSize?: number;
    userId: string;
  }
) {
  const existing = await prisma.book.findUnique({ where: { id } });
  if (!existing) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);
  const data: Prisma.BookUncheckedUpdateInput = {};
  if (params.title !== undefined) data.title = params.title;
  if (params.description !== undefined) data.description = params.description;
  if (params.authorId !== undefined) data.authorId = params.authorId;
  if (params.categoryId !== undefined) data.categoryId = params.categoryId;
  if (params.language !== undefined) data.language = params.language;
  if (params.isPublished !== undefined) data.isPublished = params.isPublished;
  if (params.coverUrl !== undefined) data.coverUrl = params.coverUrl;
  if (params.pdfUrl !== undefined) data.pdfUrl = params.pdfUrl;
  if (params.totalPages !== undefined) data.totalPages = params.totalPages;
  if (params.fileSize !== undefined) data.fileSize = params.fileSize;

  const book = await prisma.book.update({
    where: { id },
    data,
    include: bookInclude,
  });
  await logAudit({
    userId: params.userId,
    action: "UPDATE_BOOK",
    entity: "Book",
    entityId: book.id,
    metadata: { title: book.title },
  });
  if (env.meiliHost) {
    const { indexBook } = await import("./search");
    await indexBook(book);
  }
  const stats = await getBookStats([book.id]);
  return toApiBook(book, stats[book.id]);
}

export async function setPublish(
  id: string,
  isPublished: boolean,
  userId: string
) {
  const book = await prisma.book.update({
    where: { id },
    data: { isPublished },
    include: bookInclude,
  });
  await logAudit({
    userId,
    action: isPublished ? "PUBLISH_BOOK" : "UNPUBLISH_BOOK",
    entity: "Book",
    entityId: id,
    metadata: { title: book.title },
  });
  if (env.meiliHost) {
    const { indexBook } = await import("./search");
    await indexBook(book);
  }
  const stats = await getBookStats([book.id]);
  return toApiBook(book, stats[book.id]);
}

export async function deleteBook(id: string, userId: string) {
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);
  await prisma.book.delete({ where: { id } });
  await logAudit({
    userId,
    action: "DELETE_BOOK",
    entity: "Book",
    entityId: id,
    metadata: { title: book.title },
  });
  if (env.meiliHost) {
    const { deleteBookIndex } = await import("./search");
    await deleteBookIndex(id);
  }
  return { id };
}

export async function listActiveBanners(): Promise<Banner[]> {
  return prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
}

export type HomeRecommendation = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  book: Book;
};

export async function listActiveRecommendations(): Promise<HomeRecommendation[]> {
  const rows = await prisma.recommendation.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: { book: { include: bookInclude } },
  });
  return rows
    .filter((r) => r.book)
    .map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      order: r.order,
      book: toApiBook(r.book),
    }));
}
