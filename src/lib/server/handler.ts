import { NextRequest, NextResponse } from "next/server";
import { handleError } from "./errors";
import { logRequest } from "./log";
import { FixedWindowLimiter } from "./rate-limit";
import {
  SESSION_COOKIE,
  CSRF_COOKIE,
  CSRF_HEADER,
  isMutationMethod,
} from "./security";

type Handler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<Response>;

// ─── API guard (ex-middleware, route darajasida) ─────────────
// Next.js 16 proxy/middleware API route'larga POST body'ni to'g'ri
// uzatmaydi (<~30B dan katta body'lar yo'qoladi). Shu sababli
// rate-limit + CSRF double-submit himoyasi `route()` wrapper'iga
// ko'chirildi — barcha API route'lari shu wrapper orqali o'tadi.

const RL_READ_MAX = Number(process.env.RATE_LIMIT_READ_MAX || 600);
const RL_READ_WINDOW = Number(process.env.RATE_LIMIT_READ_WINDOW_MS || 60000);
const RL_MUT_MAX = Number(process.env.RATE_LIMIT_MUTATION_MAX || 120);
const RL_MUT_WINDOW = Number(process.env.RATE_LIMIT_MUTATION_WINDOW_MS || 60000);
const RL_ENABLED = (process.env.RATE_LIMIT_ENABLED ?? "true") !== "false";

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

function csrfBlocked(req: NextRequest, pathname: string): boolean {
  if (CSRF_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) return false;

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  const csrfCookie = req.cookies.get(CSRF_COOKIE)?.value;

  // Sessiya bo'lmasa — public mutation (logindan tashqari hech kim
  // ruxsat olmaydi, handler o'zi auth tekshiradi). CSRF kerak emas.
  if (!session) return false;

  // Sessiya bor, lekin CSRF cookie yo'q → eski sessiya, qayta kirish kerak.
  if (!csrfCookie) return true;

  // Double-submit: header cookie bilan mos bo'lishi shart.
  const header = req.headers.get(CSRF_HEADER);
  return !header || header !== csrfCookie;
}

function guard(req: NextRequest, pathname: string): NextResponse | null {
  const method = req.method.toUpperCase();
  if (!RL_ENABLED && !isMutationMethod(method)) return null;

  try {
    const ip = clientIp(req);
    const isMutation = isMutationMethod(method);
    const limiter = isMutation ? mutationLimiter : readLimiter;
    if (
      RL_ENABLED &&
      !RATE_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))
    ) {
      const res = limiter.check(`${method}:${ip}:${pathname}`);
      if (!res.allowed) {
        console.warn(`[RATE_LIMIT] ${ip} ${method} ${pathname}`);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: `Juda ko'p so'rov. ${res.retryAfterSec} soniyadan keyin qayta urinib ko'ring.`,
            },
          },
          { status: 429 }
        );
      }
    }
    if (isMutation && csrfBlocked(req, pathname)) {
      console.warn(`[CSRF_BLOCK] ${ip} ${method} ${pathname}`);
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Ruxsat yo'q (CSRF)" } },
        { status: 403 }
      );
    }
  } catch (e) {
    // Guard xatosi hech qachon route'ni buzmasligi kerak.
    console.error("[API_GUARD_ERROR]", e);
    return null;
  }
  return null;
}

export function route(handler: Handler): Handler {
  return async (req, ctx) => {
    const started = performance.now();
    const pathname = req.nextUrl?.pathname ?? "";

    const blocked = guard(req, pathname);
    if (blocked) return blocked;

    try {
      const res = await handler(req, ctx);
      logRequest(
        "http.request",
        req.method,
        pathname,
        res.status,
        Math.round(performance.now() - started)
      );
      return res;
    } catch (e) {
      const res = handleError(e);
      logRequest(
        "http.request",
        req.method,
        pathname,
        res.status,
        Math.round(performance.now() - started),
        { error: true }
      );
      return res;
    }
  };
}

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

export async function readJson<T>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}
