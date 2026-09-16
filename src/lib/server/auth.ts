import { cookies } from "next/headers";
import crypto from "node:crypto";
import { env, SESSION_COOKIE } from "@/lib/env";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "./errors";
import type { User } from "@prisma/client";
import type { UserRole } from "@/types";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: env.isProd,
};

// Production'da kuchli APP_SECRET talab qilinadi
function validateSecret(): void {
  if (env.isProd && env.appSecret.length < 32) {
    console.error("❌ CRITICAL: APP_SECRET must be at least 32 characters in production!");
  }
}

export type SessionInfo = { userId: string; version: number };

export function signSession(userId: string, version = 0): string {
  validateSecret();
  const sig = crypto
    .createHmac("sha256", env.appSecret)
    .update(`${userId}:${version}`)
    .digest("hex");
  return `${userId}.v${version}.${sig}`;
}

export function verifySession(token: string | undefined): SessionInfo | null {
  if (!token) return null;
  const [userId, ver, sig] = token.split(".");
  if (!userId || !ver || !sig || !ver.startsWith("v")) return null;
  const version = Number(ver.slice(1));
  if (!Number.isFinite(version)) return null;
  validateSecret();
  const expected = crypto
    .createHmac("sha256", env.appSecret)
    .update(`${userId}:${version}`)
    .digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return { userId, version };
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const info = verifySession(token);
  if (!info) return null;
  const user = await prisma.user.findUnique({ where: { id: info.userId } });
  if (!user || !user.isActive) return null;
  // Session invalidation: parol qayta tiklanmoqda → barcha eski sessiyalar yaroqsiz
  if (user.sessionVersion !== info.version) return null;
  return user;
}

export function setSessionCookie(res: Response, userId: string, version = 0) {
  if (res instanceof Response && "cookies" in res) {
    (res as NextResponseLike).cookies.set(SESSION_COOKIE, signSession(userId, version), {
      ...COOKIE_OPTS,
      maxAge: 60 * 60 * 24, // 24 soat (avval 7 kun edi)
    });
  }
}

export function clearSessionCookie(res: Response) {
  if (res instanceof Response && "cookies" in res) {
    (res as NextResponseLike).cookies.set(SESSION_COOKIE, "", {
      ...COOKIE_OPTS,
      maxAge: 0,
    });
  }
}

type NextResponseLike = Response & {
  cookies: { set: (...args: unknown[]) => void };
};

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user)
    throw new ApiError(ERROR_CODES.UNAUTHORIZED, "Tizimga kiring", 401);
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "ADMIN")
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  return user;
}

/** Admin yoki Kitob menejeri — kitob kontenti API'lari uchun. */
export async function requireBookManager(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "BOOK_MANAGER")
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  return user;
}

/** Admin yoki O'quvchi qo'shuvchi (REGISTRAR) — ariza yuborish uchun. */
export async function requireRegistrar(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "REGISTRAR")
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  return user;
}

export async function requireRole(role: UserRole): Promise<User | null> {
  const u = await getSessionUser();
  if (!u || u.role !== role) return null;
  return u;
}

export async function requireAnyRole(
  roles: UserRole[]
): Promise<User | null> {
  const u = await getSessionUser();
  if (!u || !roles.includes(u.role as UserRole)) return null;
  return u;
}

/** Barcha sessiyalarni bekor qiladi (parol o'zgartirilganda chaqiriladi). */
export async function invalidateUserSessions(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
}