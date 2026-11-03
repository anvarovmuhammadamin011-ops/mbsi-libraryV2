"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";

// Populates the client auth store from the server session on mount.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const loadUser = useAuthStore((s) => s.loadUser);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Har safar to'liq sahifa ochilganda serverdagi sessiyani tekshiramiz.
  // Persist qilingan eski `isAuthenticated=true` holatiga tayanmaymiz —
  // aks holda sessiya tugagan bo'lsa ham spinner yoki noto'g'ri holat
  // saqlanib qolishi mumkin.
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  return <>{children}</>;
}
