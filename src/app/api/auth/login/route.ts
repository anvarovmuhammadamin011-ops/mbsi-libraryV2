import { route, json, readJson } from "@/lib/server/handler";
import { setSessionCookie, clearSessionCookie } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { ERROR_CODES } from "@/lib/server/errors";
import crypto from "node:crypto";
import type { User } from "@/types";

function toUser(u: {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  coins: number | null;
  balls: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: u.id,
    name: u.name,
    role: u.role as User["role"],
    avatar: u.avatar ?? undefined,
    coins: u.coins ?? 0,
    balls: u.balls ?? 0,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

export const POST = route(async (req) => {
  const body = await readJson<{ username: string; password: string }>(req);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      { success: false, error: { code: ERROR_CODES.VALIDATION, message: "Login va parolni kiriting" } },
      400
    );
  }

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username.trim().toLowerCase() },
  });

  // Parol noto'g'ri bo'lsa ham xuddi shu xabarni qaytaramiz (username enumeration oldini olish)
  if (!user || !user.isActive || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return json(
      { success: false, error: { code: ERROR_CODES.UNAUTHORIZED, message: "Login yoki parol noto'g'ri" } },
      401
    );
  }

  const res = json({ success: true, data: toUser(user) });
  setSessionCookie(res, user.id);

  // Oxirgi tizimga kirish vaqtini yozamiz (admin "Oxirgi login" ko'rsatishi uchun)
  prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  }).catch(() => {});

  return res;
});

export const DELETE = route(async () => {
  const res = json({ success: true, data: null });
  clearSessionCookie(res);
  return res;
});
