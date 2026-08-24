import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ============================================================
// MBSI Library — Auth Middleware
// ============================================================
// Lightweight cookie-presence check. Does NOT verify the session
// signature (that happens server-side in the layout/API routes).
// This just ensures unauthenticated users get redirected to login
// before any server components render.

const SESSION_COOKIE = "mbsi_session";

// Protected paths (inside (app) route group)
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
];

function needsAuth(pathname: string): boolean {
  return protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!needsAuth(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token || !token.includes(".")) {
    // No session or malformed token → redirect to login
    return NextResponse.redirect(new URL("/login", request.url), 307);
  }

  // Session cookie exists — pass through to server component for
  // full verification (HMAC signature, DB lookup, role check).
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
  ],
};
