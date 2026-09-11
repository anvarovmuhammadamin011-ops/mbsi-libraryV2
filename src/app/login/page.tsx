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
  ShieldCheck,
  BookMarked,
  UserPlus,
  ChevronRight,
} from "lucide-react";
import type { UserRole } from "@/types";
import { roleHome } from "@/types";

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
      role: "ADMIN",
      title: t.login.admin,
      desc: t.login.adminDesc,
      icon: <ShieldCheck className="h-5 w-5" />,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      role: "BOOK_MANAGER",
      title: t.login.manager,
      desc: t.login.managerDesc,
      icon: <BookMarked className="h-5 w-5" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      role: "REGISTRAR",
      title: t.login.registrar,
      desc: t.login.registrarDesc,
      icon: <UserPlus className="h-5 w-5" />,
      color: "text-violet-600",
      bgColor: "bg-violet-50 dark:bg-violet-950/30",
    },
  ];

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(roleHome(user.role));
    }
  }, [isAuthenticated, router, user]);

  async function handle(role: UserRole) {
    setLoading(role);
    const ok = await login(role);
    setLoading(null);
    if (ok) router.push(roleHome(role));
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
        {/* Tezkor login — barcha rollar (demo) */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => handle("STUDENT")}
            disabled={loading !== null}
            className="underline underline-offset-2 hover:text-blue-600 transition-colors disabled:opacity-60"
          >
            {t.login.student} →
          </button>
          <span aria-hidden>·</span>
          <button
            type="button"
            onClick={() => handle("TEACHER")}
            disabled={loading !== null}
            className="underline underline-offset-2 hover:text-teal-600 transition-colors disabled:opacity-60"
          >
            {t.login.teacher} →
          </button>
          <span aria-hidden>·</span>
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
            onClick={() => handle("BOOK_MANAGER")}
            disabled={loading !== null}
            className="underline underline-offset-2 hover:text-emerald-600 transition-colors disabled:opacity-60"
          >
            {t.login.manager} →
          </button>
          <span aria-hidden>·</span>
          <button
            type="button"
            onClick={() => handle("REGISTRAR")}
            disabled={loading !== null}
            className="underline underline-offset-2 hover:text-violet-600 transition-colors disabled:opacity-60"
          >
            {t.login.registrar} →
          </button>
        </div>
      </div>
    </div>
  );
}
