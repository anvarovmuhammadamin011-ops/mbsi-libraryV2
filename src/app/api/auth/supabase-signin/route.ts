import { NextResponse } from "next/server";
import { route, json, readJson } from "@/lib/server/handler";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@/types";

type PendingCookie = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export const POST = route(async (req) => {
  const body = await readJson<{ email?: string; password?: string }>(req);

  const { email, password } = body;

  // ── Input validation ────────────────────────────────────────
  if (!email || !password) {
    return json(
      {
        success: false,
        error: { code: "VALIDATION", message: "Email va parol majburiy" },
      },
      400
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return json(
      {
        success: false,
        error: { code: "VALIDATION", message: "Noto'g'ri email formati" },
      },
      400
    );
  }

  if (password.length < 6) {
    return json(
      {
        success: false,
        error: {
          code: "VALIDATION",
          message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
        },
      },
      400
    );
  }

  try {
    // ── Per-IP rate limiting (5 attempts / 5 min) ─────────────
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    const store = ((globalThis as any).rateLimitStore ??= new Map<
      string,
      { count: number; resetAt: number }
    >());
    const now = Date.now();
    const attemptKey = `login:${ip}`;
    const entry = store.get(attemptKey);

    if (entry && now < entry.resetAt && entry.count >= 5) {
      return json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Juda ko'p urinish. 5 daqiqadan keyin qayta urinib ko'ring.",
          },
        },
        429
      );
    }

    if (!entry || now >= entry.resetAt) {
      store.set(attemptKey, { count: 1, resetAt: now + 5 * 60 * 1000 });
    } else {
      entry.count += 1;
    }

    // ── Supabase client (cookies are collected, then attached) ─
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return json(
        {
          success: false,
          error: {
            code: "AUTH_ERROR",
            message: error?.message.includes("Invalid login credentials")
              ? "Login yoki parol noto'g'ri"
              : "Tizim xatoligi, qayta urinib ko'ring",
          },
        },
        401
      );
    }

    const user: User = {
      id: data.user.id,
      name:
        (data.user.user_metadata?.name as string | undefined) ||
        data.user.email?.split("@")[0] ||
        "Foydalanuvchi",
      role: "STUDENT",
      avatar: data.user.user_metadata?.avatar as string | undefined,
      email: data.user.email,
      phone: data.user.phone,
      balls: 0,
      isActive: true,
      createdAt: data.user.created_at,
      updatedAt: data.user.last_sign_in_at || data.user.created_at,
    };

    const res = NextResponse.json({ success: true, data: { user } });
    pendingCookies.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options as any);
    });
    return res;
  } catch (err) {
    console.error("Supabase sign-in error:", err);
    return json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Server xatoligi" },
      },
      500
    );
  }
});
