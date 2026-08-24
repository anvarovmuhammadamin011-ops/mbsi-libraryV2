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

export function signSession(userId: string): string {
  const sig = crypto
    .createHmac("sha256", env.appSecret)
    .update(userId)
    .digest("hex");
  return `${userId}.${sig}`;
}

export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const [userId, sig] = token.split(".");
  if (!userId || !sig) return null;
  const expected = crypto
    .createHmac("sha256", env.appSecret)
    .update(userId)
    .digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return userId;
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const userId = verifySession(token);
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) return null;
  return user;
}

export function setSessionCookie(res: Response, userId: string) {
  if (res instanceof Response && "cookies" in res) {
    (res as NextResponseLike).cookies.set(SESSION_COOKIE, signSession(userId), {
      ...COOKIE_OPTS,
      maxAge: 60 * 60 * 24 * 7,
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

export async function requireRole(role: UserRole): Promise<User | null> {
  const u = await getSessionUser();
  if (!u || u.role !== role) return null;
  return u;
}
