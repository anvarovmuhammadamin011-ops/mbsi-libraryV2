import { route, json, readJson } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

// Qurilmani push obunasiga qo'shish (FCM registration token).
export const POST = route(async (req) => {
  const user = await requireUser();
  const body = await readJson<{ endpoint?: string; keys?: { p256dh?: string; auth?: string } }>(req);
  const endpoint = String(body.endpoint || "").trim();
  const p256dh = String(body.keys?.p256dh || "").trim();
  const auth = String(body.keys?.auth || "").trim();

  if (!endpoint) {
    throw new ApiError(ERROR_CODES.VALIDATION, "endpoint kerak", 400);
  }
  // FCM web tokenlari uzun registration tokenlar yoki https://...googleapis.com/... endpointlari bo'ladi.
  const looksLikeEndpoint = /^https:\/\/[a-z0-9.-]+\.googleapis\.com\//i.test(endpoint);
  const looksLikeToken = /^[A-Za-z0-9_:.=-]{20,4096}$/.test(endpoint);
  if (!looksLikeEndpoint && !looksLikeToken) {
    throw new ApiError(ERROR_CODES.VALIDATION, "endpoint qabul qilinmadi", 400);
  }

  const userAgent = req.headers.get("user-agent")?.slice(0, 255) || null;
  const row = await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: user.id, endpoint, p256dh: p256dh || null, auth: auth || null, userAgent },
    update: { userId: user.id, p256dh: p256dh || null, auth: auth || null, userAgent, lastUsedAt: new Date() },
  });

  return json({ success: true, data: { id: row.id, endpoint: row.endpoint } });
});

// Obunani olib tashlash.
export const DELETE = route(async (req) => {
  const user = await requireUser();
  const endpoint = new URL(req.url).searchParams.get("endpoint");
  await prisma.pushSubscription.deleteMany({ where: { userId: user.id, ...(endpoint ? { endpoint } : {}) } });
  return json({ success: true, data: { removed: true } });
});