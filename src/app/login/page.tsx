import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth";
import { roleHome, type UserRole } from "@/types";
import LoginForm from "./login-form";

// Login sahifasi session holatiga bog'liq — statik keshlanmasin.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Agar foydalanuvchi allaqachon tizimga kirgan bo'lsa, to'g'ridan-to'g'ri
  // o'z paneliga yuboramiz. Bu client tomondagi eski (persist) holatga
  // tayanmaslik uchun serverda tekshiriladi.
  const user = await getSessionUser().catch(() => null);

  if (user) {
    redirect(roleHome(user.role as UserRole));
  }

  return <LoginForm />;
}
