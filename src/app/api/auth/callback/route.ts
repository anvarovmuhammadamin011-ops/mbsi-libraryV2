import { NextResponse } from "next/server";
import { route } from "@/lib/server/handler";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/db";
import { signSession, setSessionCookie } from "@/lib/server/auth";
import { generateCsrfToken, setCsrfCookie } from "@/lib/server/csrf";

type PendingCookie = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

// Supabase OAuth callback.
// 1) code'ni session'ga almashtiradi
// 2) Supabase email'ini Prisma foydalanuvchisi bilan bog'laydi
// 3) mbsi_session + mbsi_csrf cookie'larini o'rnatib /home ga yo'naltiradi
export const GET = route(async (req) => {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth", req.url));
  }

  let pendingCookies: PendingCookie[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          pendingCookies = cookiesToSet;
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user?.email) {
    return NextResponse.redirect(new URL("/login?error=oauth", req.url));
  }

  // Supabase hisobini maktab tizimidagi foydalanuvchi bilan bog'lash.
  // Email unique emas — shuning uchun findFirst ishlatiladi.
  const internalUser = await prisma.user.findFirst({
    where: { email: data.user.email, isActive: true },
    select: { id: true, sessionVersion: true },
  });

  if (!internalUser) {
    return NextResponse.redirect(
      new URL("/login?error=no_account", req.url)
    );
  }

  const res = NextResponse.redirect(new URL("/home", req.url));

  pendingCookies.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, options as any);
  });

  const sessionToken = signSession(
    internalUser.id,
    internalUser.sessionVersion
  );
  setSessionCookie(res, internalUser.id, internalUser.sessionVersion);
  setCsrfCookie(res, generateCsrfToken(sessionToken));

  return res;
});
