"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useLanguage } from "@/lib/i18n/language-provider";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  BookOpen,
  GraduationCap,
  BookMarked,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import type { UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [loading, setLoading] = useState<UserRole | null>(null);

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
      title: t.login.student,
      desc: t.login.studentDesc,
      icon: <GraduationCap className="h-5 w-5" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      role: "TEACHER",
      title: t.login.teacher,
      desc: t.login.teacherDesc,
      icon: <BookMarked className="h-5 w-5" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      role: "ADMIN",
      title: t.login.admin,
      desc: t.login.adminDesc,
      icon: <ShieldCheck className="h-5 w-5" />,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
    },
  ];

  useEffect(() => {
    if (isAuthenticated) {
      const role = user?.role;
      router.replace(role === "ADMIN" ? "/admin" : "/home");
    }
  }, [isAuthenticated, router, user]);

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
              {t.login.subtitle}
            </p>
          </div>
        </div>

        {/* Role cards */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 px-1">
            {t.login.selectRole}
          </p>
          {ROLES.map((r) => (
            <button
              key={r.role}
              onClick={() => handle(r.role)}
              disabled={loading !== null}
              className={`group flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left transition-all duration-200 hover:shadow-md disabled:opacity-60 border-border hover:border-border/80 hover:bg-accent`}
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
          {t.login.demoNote}
        </p>
        {/* Quick access: admin & teacher */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => handle("ADMIN")}
            disabled={loading !== null}
            className="underline underline-offset-2 hover:text-amber-600 transition-colors disabled:opacity-60"
          >
            {t.login.admin} →
          </button>
          <span aria-hidden>·</span>
          <button
            type="button"
            onClick={() => handle("TEACHER")}
            disabled={loading !== null}
            className="underline underline-offset-2 hover:text-emerald-600 transition-colors disabled:opacity-60"
          >
            {t.login.teacher} →
          </button>
        </div>
      </div>
    </div>
  );
}
