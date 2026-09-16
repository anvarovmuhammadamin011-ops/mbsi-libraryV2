import crypto from "node:crypto";
import { env } from "@/lib/env";
import { CSRF_COOKIE, CSRF_HEADER } from "./security";
import { ApiError, ERROR_CODES } from "./errors";

// ─── CSRF — Double-submit cookie ────────────────────────────
// On login we issue a random CSRF token as a readable cookie.
// The client echoes it back in the `x-csrf-token` header on every
// mutation. The server (middleware) compares them — a cross-site
// attacker cannot read the cookie, so they cannot forge the header.
// The token is ALSO bound to the session id via an HMAC signature
// so a stolen cookie can't be replayed with a different session.

const CSRF_SECRET = "mbsi-csrf-" + env.appSecret;

/**
 * Generate a CSRF token bound to a session id.
 */
export function generateCsrfToken(sessionId: string): string {
  const payload = `${sessionId}:${Date.now()}`;
  const sig = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(payload)
    .digest("hex");
  return Buffer.from(payload).toString("base64url") + "." + sig;
}

/**
 * Validate token signature and session binding.
 */
export function validateCsrfToken(token: string, sessionId: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  try {
    const payload = Buffer.from(parts[0], "base64url").toString("utf8");
    const sig = parts[1];
    const expected = crypto
      .createHmac("sha256", CSRF_SECRET)
      .update(payload)
      .digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return false;
    }
    // payload = `${sessionId}:${issuedAt}`; must match current session
    const colon = payload.lastIndexOf(":");
    if (colon <= 0) return false;
    const boundSession = payload.slice(0, colon);
    return boundSession === sessionId;
  } catch {
    return false;
  }
}

export function setCsrfCookie(res: Response, token: string) {
  if (res instanceof Response && "cookies" in res) {
    (res as NextResponseLike).cookies.set(CSRF_COOKIE, token, {
      httpOnly: false, // o'qib bo'lmaydigan bo'lmasligi kerak — client qaytaradi
      sameSite: "lax",
      secure: env.isProd,
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }
}

export function clearCsrfCookie(res: Response) {
  if (res instanceof Response && "cookies" in res) {
    (res as NextResponseLike).cookies.set(CSRF_COOKIE, "", {
      httpOnly: false,
      sameSite: "lax",
      secure: env.isProd,
      path: "/",
      maxAge: 0,
    });
  }
}

export function getCsrfHeader(request: Request): string {
  return request.headers.get(CSRF_HEADER) ?? "";
}

export function getCsrfCookie(value: string | undefined): string {
  return value ?? "";
}

type NextResponseLike = Response & {
  cookies: { set: (...args: unknown[]) => void };
};

/**
 * Require a valid CSRF token for mutation requests.
 */
export function requireCsrf(
  request: Request,
  sessionId: string
): void {
  const method = request.method?.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return;
  }
  const token = getCsrfHeader(request);
  if (!validateCsrfToken(token, sessionId)) {
    throw new ApiError(
      ERROR_CODES.FORBIDDEN,
      "CSRF token noto'g'ri yoki muddati o'tgan",
      403
    );
  }
}