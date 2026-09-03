"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

export function ProfileLogoutButton() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-red-600 transition-colors hover:bg-muted/50 dark:text-red-400"
    >
      <span className="flex items-center gap-4">
        <LogOut size={20} className="text-red-500" />
        Chiqish
      </span>
    </button>
  );
}
