import { route, json } from "@/lib/server/handler";
import { createServerClient } from "@supabase/ssr";

export const GET = route(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider") as "google" | "github" | null;

    if (!provider) {
      return json(
        {
          success: false,
          error: { code: "VALIDATION", message: "Provider kerak" },
        },
        400
      );
    }

    const validProviders = ["google", "github"];
    if (!validProviders.includes(provider)) {
      return json(
        {
          success: false,
          error: { code: "VALIDATION", message: "Noto'g'ri provider" },
        },
        400
      );
    }

    // ── Per-IP rate limiting (3 attempts / 15 min) ────────────
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const rateLimitKey = `oauth:${provider}:${ip}`;
    const store = ((globalThis as any).oauthRateLimitStore ??= new Map<
      string,
      { count: number; resetAt: number }
    >());
    const now = Date.now();
    const entry = store.get(rateLimitKey);

    if (entry && now < entry.resetAt && entry.count >= 3) {
      return json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring.",
          },
        },
        429
      );
    }

    if (!entry || now >= entry.resetAt) {
      store.set(rateLimitKey, { count: 1, resetAt: now + 15 * 60 * 1000 });
    } else {
      entry.count += 1;
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: () => {
            // OAuth boshlanishida cookie yozilmaydi — callback'da yoziladi.
          },
        },
      }
    );

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      "http://localhost:3000";

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${appUrl.replace(/\/$/, "")}/api/auth/callback`,
      },
    });

    if (error || !data.url) {
      return json(
        {
          success: false,
          error: { code: "AUTH_ERROR", message: "OAuth xatoligi" },
        },
        400
      );
    }

    return json({ success: true, data: { authUrl: data.url } });
  } catch (err) {
    console.error("Supabase OAuth error:", err);
    return json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Server xatoligi" },
      },
      500
    );
  }
});
