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
      className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-medium text-red-600 transition-colors hover:bg-muted/50 dark:text-red-400"
    >
      <span className="flex items-center gap-3">
        <LogOut size={18} className="text-red-500" />
        Log out
      </span>
    </button>
  );
}
