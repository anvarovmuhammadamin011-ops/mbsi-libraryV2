import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { ApiError, ERROR_CODES } from "./errors";
import { logAudit } from "./audit";
import { slugify } from "./books";

// ─── Authors ───────────────────────────────────────────────
export async function listAuthors() {
  const rows = await prisma.author.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { books: true } } },
  });
  return rows.map((a) => ({
    id: a.id,
    name: a.name,
    biography: a.biography ?? undefined,
    avatar: a.avatar ?? undefined,
    bookCount: a._count.books,
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function createAuthor(data: {
  name: string;
  biography?: string;
  avatar?: string;
  userId: string;
}) {
  const author = await prisma.author.create({
    data: {
      name: data.name,
      biography: data.biography ?? null,
      avatar: data.avatar ?? null,
    },
  });
  await logAudit({
    userId: data.userId,
    action: "CREATE_AUTHOR",
    entity: "Author",
    entityId: author.id,
    metadata: { name: author.name },
  });
  return author;
}

export async function updateAuthor(
  id: string,
  data: { name?: string; biography?: string; avatar?: string; userId: string }
) {
  const author = await prisma.author.update({
    where: { id },
    data: {
      name: data.name,
      biography: data.biography,
      avatar: data.avatar,
    },
  });
  await logAudit({
    userId: data.userId,
    action: "UPDATE_AUTHOR",
    entity: "Author",
    entityId: id,
    metadata: { name: author.name },
  });
  return author;
}

export async function deleteAuthor(id: string, userId: string) {
  const count = await prisma.book.count({ where: { authorId: id } });
  if (count > 0) {
    throw new ApiError(
      ERROR_CODES.CONFLICT,
      "Muallifning kitoblari mavjud. Avval kitoblarni o'ching.",
      409
    );
  }
  await prisma.author.delete({ where: { id } });
  await logAudit({
    userId,
    action: "DELETE_AUTHOR",
    entity: "Author",
    entityId: id,
  });
}

// ─── Categories ────────────────────────────────────────────
export async function listCategories() {
  const rows = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { books: true } } },
  });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? undefined,
    icon: c.icon ?? undefined,
    bookCount: c._count.books,
    createdAt: c.createdAt.toISOString(),
  }));
}

async function uniqueCatSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (await prisma.category.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function createCategory(data: {
  name: string;
  description?: string;
  icon?: string;
  userId: string;
}) {
  const slug = await uniqueCatSlug(data.name);
  const cat = await prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description ?? null,
      icon: data.icon ?? null,
    },
  });
  await logAudit({
    userId: data.userId,
    action: "CREATE_CATEGORY",
    entity: "Category",
    entityId: cat.id,
    metadata: { name: cat.name },
  });
  return cat;
}

export async function updateCategory(
  id: string,
  data: { name?: string; description?: string; icon?: string; userId: string }
) {
  const cat = await prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      icon: data.icon,
    },
  });
  await logAudit({
    userId: data.userId,
    action: "UPDATE_CATEGORY",
    entity: "Category",
    entityId: id,
    metadata: { name: cat.name },
  });
  return cat;
}

export async function deleteCategory(id: string, userId: string) {
  const count = await prisma.book.count({ where: { categoryId: id } });
  if (count > 0) {
    throw new ApiError(
      ERROR_CODES.CONFLICT,
      "Kategoriyada kitoblar mavjud. Avval kitoblarni o'ching.",
      409
    );
  }
  await prisma.category.delete({ where: { id } });
  await logAudit({
    userId,
    action: "DELETE_CATEGORY",
    entity: "Category",
    entityId: id,
  });
}

// ─── Banners ───────────────────────────────────────────────
export async function listBanners(activeOnly = false) {
  const rows = await prisma.banner.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return rows.map((b) => ({
    id: b.id,
    title: b.title,
    description: b.description ?? undefined,
    imageUrl: b.imageUrl ?? undefined,
    link: b.link ?? undefined,
    order: b.order,
    isActive: b.isActive,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));
}

export async function createBanner(data: {
  title: string;
  description?: string;
  imageUrl?: string;
  link?: string;
  order?: number;
  isActive?: boolean;
  userId: string;
}) {
  const banner = await prisma.banner.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      link: data.link ?? null,
      order: data.order ?? 0,
      isActive: data.isActive ?? true,
    },
  });
  await logAudit({
    userId: data.userId,
    action: "CREATE_BANNER",
    entity: "Banner",
    entityId: banner.id,
  });
  return banner;
}

export async function updateBanner(
  id: string,
  data: {
    title?: string;
    description?: string;
    imageUrl?: string;
    link?: string;
    order?: number;
    isActive?: boolean;
    userId: string;
  }
) {
  const banner = await prisma.banner.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      link: data.link,
      order: data.order,
      isActive: data.isActive,
    },
  });
  await logAudit({
    userId: data.userId,
    action: "UPDATE_BANNER",
    entity: "Banner",
    entityId: id,
  });
  return banner;
}

export async function deleteBanner(id: string, userId: string) {
  await prisma.banner.delete({ where: { id } });
  await logAudit({
    userId,
    action: "DELETE_BANNER",
    entity: "Banner",
    entityId: id,
  });
}

// ─── Recommendations ───────────────────────────────────────
export async function listRecommendations(activeOnly = false) {
  const rows = await prisma.recommendation.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { book: { include: { author: true, category: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    bookId: r.bookId,
    book: r.book
      ? {
          id: r.book.id,
          title: r.book.title,
          slug: r.book.slug,
          coverUrl: r.book.coverUrl ?? "",
          author: r.book.author?.name ?? "",
          language: r.book.language,
        }
      : undefined,
    order: r.order,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function createRecommendation(data: {
  title: string;
  description?: string;
  bookId: string;
  order?: number;
  isActive?: boolean;
  userId: string;
}) {
  const rec = await prisma.recommendation.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      bookId: data.bookId,
      order: data.order ?? 0,
      isActive: data.isActive ?? true,
    },
  });
  await logAudit({
    userId: data.userId,
    action: "CREATE_RECOMMENDATION",
    entity: "Recommendation",
    entityId: rec.id,
  });
  return rec;
}

export async function updateRecommendation(
  id: string,
  data: {
    title?: string;
    description?: string;
    bookId?: string;
    order?: number;
    isActive?: boolean;
    userId: string;
  }
) {
  const rec = await prisma.recommendation.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      bookId: data.bookId,
      order: data.order,
      isActive: data.isActive,
    },
  });
  await logAudit({
    userId: data.userId,
    action: "UPDATE_RECOMMENDATION",
    entity: "Recommendation",
    entityId: id,
  });
  return rec;
}

export async function deleteRecommendation(id: string, userId: string) {
  await prisma.recommendation.delete({ where: { id } });
  await logAudit({
    userId,
    action: "DELETE_RECOMMENDATION",
    entity: "Recommendation",
    entityId: id,
  });
}

// ─── Users (admin) ─────────────────────────────────────────
export async function listUsers(query?: { role?: string; q?: string }) {
  const where: Prisma.UserWhereInput = {};
  if (query?.role) where.role = query.role;
  if (query?.q) {
    where.name = { contains: query.q, ...(process.env.DATABASE_URL?.includes("sqlite") ? {} : { mode: "insensitive" }) };
  }
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, role: true, avatar: true, isActive: true, createdAt: true, updatedAt: true },
  });
  const ids = users.map((u) => u.id);
  const [pages, completed, active] = await Promise.all([
    prisma.readingSession.groupBy({ by: ["userId"], where: { userId: { in: ids } }, _sum: { pagesRead: true, duration: true } }),
    prisma.readingProgress.groupBy({ by: ["userId"], where: { userId: { in: ids }, completedAt: { not: null } }, _count: { _all: true } }),
    prisma.readingProgress.groupBy({ by: ["userId"], where: { userId: { in: ids }, completedAt: null }, _count: { _all: true } }),
  ]);
  const pagesMap = new Map(pages.map((p) => [p.userId, p._sum]));
  const compMap = new Map(completed.map((c) => [c.userId, c._count._all]));
  const actMap = new Map(active.map((a) => [a.userId, a._count._all]));
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    avatar: u.avatar ?? undefined,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    stats: {
      totalPages: pagesMap.get(u.id)?.pagesRead ?? 0,
      readingTime: Math.round((pagesMap.get(u.id)?.duration ?? 0) / 60),
      completedBooks: compMap.get(u.id) ?? 0,
      activeBooks: actMap.get(u.id) ?? 0,
    },
  }));
}

export async function updateUser(
  id: string,
  data: { isActive?: boolean; role?: string; userId: string }
) {
  const before = await prisma.user.findUnique({ where: { id } });
  if (!before) throw new ApiError(ERROR_CODES.NOT_FOUND, "Foydalanuvchi topilmadi", 404);
  const user = await prisma.user.update({
    where: { id },
    data: { isActive: data.isActive, role: data.role },
  });
  const actions: string[] = [];
  if (data.isActive !== undefined && data.isActive !== before.isActive)
    actions.push(data.isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER");
  if (data.role !== undefined && data.role !== before.role)
    actions.push("CHANGE_ROLE");
  for (const action of actions) {
    await logAudit({
      userId: data.userId,
      action,
      entity: "User",
      entityId: id,
      metadata: { name: user.name, role: user.role, isActive: user.isActive },
    });
  }
  return user;
}

export async function listAuditLogs(limit = 100, page = 1) {
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true, role: true } } },
    }),
    prisma.auditLog.count(),
  ]);
  return {
    items: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      user: r.user
        ? { id: r.user.id, name: r.user.name, role: r.user.role }
        : undefined,
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      metadata: r.metadata,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize: limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function updateProfile(
  id: string,
  data: { name?: string; avatar?: string }
) {
  const user = await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      avatar: data.avatar ?? null,
    },
  });
  return user;
}
