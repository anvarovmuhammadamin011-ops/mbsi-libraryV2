import { route, json, readJson } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { markRead } from "@/lib/server/push";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

// Bildirishnomalar ro'yxati + o'qilmaganlar soni.
export const GET = route(async (req) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
  const onlyUnread = url.searchParams.get("unread") === "1";

  const where = { userId: user.id, ...(onlyUnread ? { readAt: null } : {}) };
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true, type: true, title: true, body: true,
        url: true, readAt: true, createdAt: true,
      },
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  return json({
    success: true,
    data: {
      items: items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.body,
        url: n.url,
        read: Boolean(n.readAt),
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    },
  });
});

// Bitta yoki barcha bildirishnomalarni o'qilgan deb belgilash.
export const POST = route(async (req) => {
  const user = await requireUser();
  const body = await readJson<{ ids?: string[] }>(req);
  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean).slice(0, 200) : undefined;
  const updated = await markRead(user.id, ids);
  return json({ success: true, data: { updated } });
});

// Barcha bildirishnomalarni o'chirish.
export const DELETE = route(async (req) => {
  const user = await requireUser();
  const r = await prisma.notification.deleteMany({ where: { userId: user.id } });
  return json({ success: true, data: { deleted: r.count } });
});