"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Shield,
  BookMarked,
  ChevronRight,
} from "lucide-react";
import type { UserRole } from "@/types";

const ROLES: {
  role: UserRole;
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}[] = [
  {
    role: "STUDENT",
    title: "O'quvchi",
    desc: "Kitoblarni o'qish, reyting va yutuqlar",
    icon: <GraduationCap className="h-5 w-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    role: "TEACHER",
    title: "O'qituvchi",
    desc: "Kuzatuv, topshiriqlar va tavsiyalar",
    icon: <BookMarked className="h-5 w-5" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    role: "ADMIN",
    title: "Admin Panel",
    desc: "Boshqaruv markazi — kitoblar, foydalanuvchilar, statistika",
    icon: <Shield className="h-5 w-5" />,
    color: "text-primary",
    bgColor: "bg-primary/5",
  },
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              MBSI Library
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Bilimga yo&apos;l oching
            </p>
          </div>
        </div>

        {/* Role cards */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 px-1">
            Davom etish uchun tanlang
          </p>
          {ROLES.map((r) => (
            <button
              key={r.role}
              onClick={() => handle(r.role)}
              disabled={loading !== null}
              className={`group flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left transition-all duration-200 hover:shadow-md disabled:opacity-60 ${
                r.role === "ADMIN"
                  ? "border-primary/20 hover:border-primary/50 hover:bg-primary/5"
                  : "border-border hover:border-border/80 hover:bg-accent"
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${r.bgColor} ${r.color}`}
              >
                {r.icon}
              </div>
              <div className="flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  {r.title}
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {r.desc}
                </span>
              </div>
              {loading === r.role ? (
                <Loader2 className="size-4 animate-spin text-primary" />
              ) : (
                <ChevronRight
                  size={16}
                  className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                />
              )}
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Demo rejim — haqiqiy autentifikatsiya hali yo&apos;q
        </p>
      </div>
    </div>
  );
}
