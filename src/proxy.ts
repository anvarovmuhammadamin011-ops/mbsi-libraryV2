import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { FixedWindowLimiter } from "./lib/server/rate-limit";
import {
  SESSION_COOKIE,
  CSRF_COOKIE,
  CSRF_HEADER,
  isMutationMethod,
} from "./lib/server/security";

// ============================================================
// MBSI Library — Auth + Security Proxy (Next.js 16 `proxy.ts`)
// ============================================================
// 1. Page routes: lightweight session-presence check (real
//    signature verification happens server-side in layouts).
//
// NOTE: /api/* ATAYIN matcher'dan chiqarilgan — Next.js 16.3.2
// proxy/middleware API route'larga POST body'ni to'g'ri uzatmaydi
// (~30B dan katta body'lar yo'qoladi). Rate-limit + CSRF himoyasi
// endi src/lib/server/handler.ts dagi `route()` wrapper'ida.
// Agar Next.js yangi versiyasida bu tuziladi — matcher'ga
// "/api/:path*" ni qaytarish kifoya.

const protectedPaths = [
  "/home",
  "/books",
  "/ranking",
  "/favorites",
  "/bookmarks",
  "/profile",
  "/continue-reading",
  "/reader",
  "/admin",
  "/manager",
  "/registrar",
];

// ── Rate limiting config (Edge-safe, read from process.env) ──
const RL_ENABLED = (process.env.RATE_LIMIT_ENABLED ?? "true") !== "false";
const RL_READ_MAX = Number(process.env.RATE_LIMIT_READ_MAX || 600);
const RL_READ_WINDOW = Number(process.env.RATE_LIMIT_READ_WINDOW_MS || 60000);
const RL_MUT_MAX = Number(process.env.RATE_LIMIT_MUTATION_MAX || 120);
const RL_MUT_WINDOW = Number(process.env.RATE_LIMIT_MUTATION_WINDOW_MS || 60000);

const readLimiter = new FixedWindowLimiter({
  max: RL_READ_MAX,
  windowMs: RL_READ_WINDOW,
});
const mutationLimiter = new FixedWindowLimiter({
  max: RL_MUT_MAX,
  windowMs: RL_MUT_WINDOW,
});

// Webhook/POST-bepul endpointlar (server-to-server, CSRF tekshirilmaydi)
const CSRF_EXEMPT_PREFIXES = ["/api/auth/login"];

// Past trafik GET endpointlar — rate-limitdan istisno
const RATE_EXEMPT_PREFIXES = ["/api/pdf", "/api/files"];

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

function needsAuth(pathname: string): boolean {
  return protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function rateLimited(
  req: NextRequest,
  method: string,
  pathname: string
): { limited: boolean; retryAfterSec: number } {
  const ip = clientIp(req);
  const isMutation = isMutationMethod(method);
  const limiter = isMutation ? mutationLimiter : readLimiter;
  const key = `${method}:${ip}:${pathname}`;
  const res = limiter.check(key);
  return { limited: !res.allowed, retryAfterSec: res.retryAfterSec };
}

function csrfBlocked(req: NextRequest, pathname: string, method: string): boolean {
  if (!isMutationMethod(method)) return false;
  if (CSRF_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) return false;

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  const csrfCookie = req.cookies.get(CSRF_COOKIE)?.value;

  // Sessiya bo'lmasa — public mutation (logindan tashqari hech kim
  // ruxsat olmaydi, server xatoga beradi). CSRF kerak emas.
  if (!session) return false;

  // Sessiya bor, lekin CSRF cookie yo'q → eski sessiya, qayta kirish kerak.
  if (!csrfCookie) return true;

  // Double-submit: header cookie bilan mos bo'lishi shart.
  const header = req.headers.get(CSRF_HEADER);
  return !header || header !== csrfCookie;
}

function jsonError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

function getClientIpForLog(req: NextRequest): string {
  return clientIp(req);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  // ── API security (rate limit + CSRF) ──────────────────────
  if (pathname.startsWith("/api/")) {
    try {
      if (
        RL_ENABLED &&
        !RATE_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))
      ) {
        const { limited, retryAfterSec } = rateLimited(request, method, pathname);
        if (limited) {
          console.warn(
            `[RATE_LIMIT] ${getClientIpForLog(request)} ${method} ${pathname}`
          );
          return jsonError(
            429,
            "RATE_LIMITED",
            `Juda ko'p so'rov. ${retryAfterSec} soniyadan keyin qayta urinib ko'ring.`
          );
        }
      }
      if (csrfBlocked(request, pathname, method)) {
        console.warn(
          `[CSRF_BLOCK] ${getClientIpForLog(request)} ${method} ${pathname}`
        );
        return jsonError(403, "FORBIDDEN", "Ruxsat yo'q (CSRF)");
      }
    } catch (e) {
      // Proxi xatosi hech qachon frontendni buzmasligi kerak.
      console.error("[SECURITY_PROXY_ERROR]", e);
      return NextResponse.next();
    }
    return NextResponse.next();
  }

  // ── Page auth redirect ────────────────────────────────────
  if (!needsAuth(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !token.includes(".")) {
    return NextResponse.redirect(new URL("/login", request.url), 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/books/:path*",
    "/ranking/:path*",
    "/favorites/:path*",
    "/bookmarks/:path*",
    "/profile/:path*",
    "/continue-reading/:path*",
    "/reader/:path*",
    "/admin/:path*",
    "/manager/:path*",
    "/registrar/:path*",
  ],
};