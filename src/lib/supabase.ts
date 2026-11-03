// Supabase SSR client (ixtiyoriy scaffold).
// Asosiy autentifikatsiya custom session cookie orqali ishlaydi; bu fayl
// kelgusi Supabase Auth/OAuth integratsiyasi uchun tayyorlangan.
//
// Kerakli env:
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, type NextResponse } from "next/server";

export function createSupabaseClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}

// Type for Supabase user
export type SupabaseUser = {
  id: string;
  email: string | null;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_at: string | null;
  role: string | null;
};

// Type for session
export type SupabaseSession = {
  access_token: string;
  refresh_token: string | null;
  expires_at: number;
  token_type: string;
  user: SupabaseUser;
};
