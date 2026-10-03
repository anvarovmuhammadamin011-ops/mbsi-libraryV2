// Bildirishnoma yuborish: DB ga yozish + FCM (Firebase Cloud Messaging).
// Firebase sozlanmagan bo'lsa ham DB yozuvi saqlanadi — ilova buzilmaydi.
import { prisma } from "@/lib/db";

export type NotificationType =
  | "mission"
  | "book"
  | "rank"
  | "system"
  | "achievement";

type NotifyInput = {
  userId: string;
  type?: NotificationType;
  title: string;
  body: string;
  url?: string;
  icon?: string;
  /** true bo'lsa, FCM tokenlari bo'lmaganda ham xabar qaytariladi. */
  push?: boolean;
};

let adminReady: boolean | null = null;

function getMessaging() {
  if (adminReady === false) return null;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    adminReady = false;
    return null;
  }
  try {
    const admin = require("firebase-admin");
    if (!admin.apps.length) {
      const credentials = JSON.parse(raw);
      admin.initializeApp({ credential: admin.credential.cert(credentials) });
    }
    adminReady = true;
    return admin.messaging();
  } catch {
    adminReady = false;
    return null;
  }
}

export const pushConfigured = () => Boolean(getMessaging());

/** Foydalanuvchi uchun bildirishnoma yozadi va (mumkin bo'lsa) push yuboradi. */
export async function notifyUser(input: NotifyInput) {
  const row = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type ?? "system",
      title: input.title,
      body: input.body,
      url: input.url ?? null,
      icon: input.icon ?? null,
    },
  });

  let pushed = 0;
  if (input.push !== false) {
    const messaging = getMessaging();
    if (messaging) {
      const subs = await prisma.pushSubscription.findMany({
        where: { userId: input.userId },
      });
      if (subs.length) {
        const tokens = subs.map((s) => s.endpoint);
        try {
          const res = await messaging.sendEachForMulticast({
            tokens,
            notification: { title: input.title, body: input.body },
            webpush: {
              fcmOptions: { link: input.url ?? "/notifications" },
              notification: {
                title: input.title,
                body: input.body,
                icon: input.icon ?? "/icons/icon-192.png",
                badge: "/icons/icon-192.png",
                tag: row.id,
              },
            },
            data: {
              id: row.id,
              url: input.url ?? "/notifications",
              type: input.type ?? "system",
            },
          });
          pushed = res.successCount;
          // O'chirilgan/invalid tokenlarni tozalash
          const dead: string[] = [];
          res.responses.forEach((r: { success: boolean }, i: number) => {
            if (!r.success && tokens[i]) dead.push(tokens[i]);
          });
          if (dead.length) {
            await prisma.pushSubscription.deleteMany({
              where: { endpoint: { in: dead } },
            });
          }
          if (subs.length) {
            await prisma.pushSubscription.updateMany({
              where: { userId: input.userId },
              data: { lastUsedAt: new Date() },
            });
          }
        } catch (e) {
          console.error("[push] yuborishda xato:", (e as Error).message);
        }
      }
    }
  }

  return { id: row.id, pushed };
}

/** Bitta xabarni o'qilgan deb belgilash. */
export async function markRead(userId: string, ids?: string[]) {
  const where = ids?.length
    ? { userId, id: { in: ids }, readAt: null }
    : { userId, readAt: null };
  const r = await prisma.notification.updateMany({ where, data: { readAt: new Date() } });
  return r.count;
}

/**
 * Bir xil xabarni ko'p foydalanuvchiga yuboradi (parthalar bo'lib).
 * Bitta foydalanuvchining xatosi boshqalarini to'xtatmaydi.
 */
export async function notifyUsers(
  userIds: string[],
  input: Omit<NotifyInput, "userId">
) {
  const unique = [...new Set(userIds.filter(Boolean))];
  const BATCH = 25;
  let created = 0;
  let pushed = 0;

  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map((id) => notifyUser({ ...input, userId: id }))
    );
    results.forEach((r) => {
      if (r.status === "fulfilled") {
        created += 1;
        pushed += r.value.pushed;
      }
    });
  }

  return { recipients: unique.length, created, pushed };
}

/** Bildirishnoma oladigan foydalanuvchilar (o'quvchilar + o'qituvchilar). */
export async function getNotifiableUserIds(excludeUserId?: string) {
  const users = await prisma.user.findMany({
    where: { isActive: true, ...(excludeUserId ? { id: { not: excludeUserId } } : {}) },
    select: { id: true, role: true },
  });
  return users
    .filter((u) => u.role === "STUDENT" || u.role === "TEACHER")
    .map((u) => u.id);
}