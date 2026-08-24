"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MBSILogo } from "@/components/mbsi-logo";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@/types";

const ROLES: { role: UserRole; title: string; desc: string; icon: string }[] = [
  { role: "STUDENT", title: "O'quvchi", desc: "Kitoblarni o'qish va reyting", icon: "👨‍🎓" },
  { role: "TEACHER", title: "O'qituvchi", desc: "Kuzatuv va tavsiyalar", icon: "👨‍🏫" },
  { role: "ADMIN", title: "Admin", desc: "Boshqaruv paneli", icon: "🛠" },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [loading, setLoading] = useState<UserRole | null>(null);

  if (isAuthenticated && typeof window !== "undefined") {
    router.replace("/home");
  }

  async function handle(role: UserRole) {
    setLoading(role);
    const ok = await login(role);
    setLoading(null);
    if (ok) router.push(role === "ADMIN" ? "/admin" : "/home");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <MBSILogo size="lg" />
          <h1 className="text-2xl font-semibold">MBSI Library</h1>
          <p className="text-center text-sm text-muted-foreground">
            Davom etish uchun rol tanlang (demo rejim)
          </p>
        </div>
        <div className="grid gap-3">
          {ROLES.map((r) => (
            <Card key={r.role} className="p-0">
              <button
                onClick={() => handle(r.role)}
                disabled={loading !== null}
                className="flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors hover:bg-muted"
              >
                <span className="text-3xl">{r.icon}</span>
                <span className="flex-1">
                  <span className="block font-medium">{r.title}</span>
                  <span className="block text-sm text-muted-foreground">
                    {r.desc}
                  </span>
                </span>
                {loading === r.role ? (
                  <Loader2 className="size-5 animate-spin text-primary" />
                ) : (
                  <span className="text-muted-foreground">→</span>
                )}
              </button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
