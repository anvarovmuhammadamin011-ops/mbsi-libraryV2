"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, KeyRound, GraduationCap, BookOpen, Users, Briefcase } from "lucide-react";

const DEMO_ACCOUNTS = [
  { login: "student", role: "O'quvchi", icon: GraduationCap, description: "Kitob o'qish va baholash" },
  { login: "teacher", role: "O'qituvchi", icon: BookOpen, description: "O'quvchilar statistikasi" },
  { login: "staff", role: "Hodim", icon: Briefcase, description: "Maktab xodimi" },
  { login: "admin", role: "Administrator", icon: KeyRound, description: "To'liq boshqaruv" },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [loadingLogin, setLoadingLogin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace("/home");
    }
  }, [isAuthenticated, router, user]);

  async function handleDemo(accLogin: string) {
    if (loadingLogin) return;
    setLoadingLogin(accLogin);
    setError(null);
    const ok = await login(accLogin, "demo123");
    setLoadingLogin(null);
    if (!ok) {
      setError(
        `Demo login muvaffaqiyatsiz. "${accLogin}" akkaunti mavjudligini tekshiring.`
      );
      return;
    }
    router.push("/home");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 sm:p-6">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg animate-fade-in">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-border bg-card p-3 shadow-lg shadow-black/5">
            <Image
              src="/logo/school-logoV2.svg"
              alt="MBSI Library"
              width={56}
              height={56}
              className="h-auto w-auto"
            />
          </div>
        </div>

        {/* Sarlavha */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tizimga kirish
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Rolni tanlang va kirish
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo kirishlar */}
        <div className="w-full space-y-2.5 rounded-3xl border bg-card p-6 shadow-xl shadow-black/5">
          {DEMO_ACCOUNTS.map((a) => {
            const Icon = a.icon;
            const loading = loadingLogin === a.login;
            return (
              <Button
                key={a.login}
                type="button"
                variant="secondary"
                disabled={Boolean(loadingLogin) && !loading}
                onClick={() => handleDemo(a.login)}
                className="h-14 w-full rounded-xl px-4 text-left text-sm font-medium"
              >
                <span className="flex w-full items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4 text-primary" />
                    )}
                  </span>
                  <span className="flex flex-col">
                    <span className="font-semibold text-foreground">{a.role}</span>
                    <span className="text-xs text-muted-foreground">{a.description}</span>
                  </span>
                  <span className="ml-auto font-mono text-xs text-primary">
                    {a.login}
                  </span>
                </span>
              </Button>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          MBSI Library © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}