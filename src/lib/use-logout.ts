"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

/**
 * Logout + login sahifasiga qaytarish (barcha sidebar/profil uchun yagona).
 */
export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return useCallback(async () => {
    await logout();
    router.replace("/login");
    router.refresh();
  }, [logout, router]);
}
