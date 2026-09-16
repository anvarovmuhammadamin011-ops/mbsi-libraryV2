import { route, json, readJson } from "@/lib/server/handler";
import { setSessionCookie, clearSessionCookie, signSession } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { ERROR_CODES } from "@/lib/server/errors";
import { generateCsrfToken, setCsrfCookie } from "@/lib/server/csrf";
import { verifyPassword } from "@/lib/server/password";
import type { User } from "@/types";

// ─── Rate limiting (in-memory, per-IP) ──────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  
  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }
  
  entry.count++;
  return true;
}

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

export const POST = route(async (req) => {
  const body = await readJson<{ username?: string; password?: string }>(req);
  
  // Get client IP for rate limiting
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  
  // Check rate limit
  if (!checkRateLimit(ip)) {
    return json(
      { success: false, error: { code: ERROR_CODES.VALIDATION, message: "Juda ko'p urinish. 5 daqiqadan keyin qayta urinib ko'ring." } },
      429
    );
  }

  // Asosiy login (username + parol)
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
  const sessionVersion = (user as unknown as { sessionVersion?: number }).sessionVersion ?? 0;
  const sessionToken = signSession(user.id, sessionVersion);
  setSessionCookie(res, user.id, sessionVersion);
  // CSRF double-submit cookie — client uni o'qib, mutation so'rovlariga qaytaradi
  setCsrfCookie(res, generateCsrfToken(sessionToken));

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
