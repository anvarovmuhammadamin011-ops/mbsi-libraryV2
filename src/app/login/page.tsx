"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { useAuthStore } from "@/lib/auth-store";
import { roleHome } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AlertCircle,
  KeyRound,
  Users,
  BookOpen,
  LogIn,
} from "lucide-react";

const DEMO_ACCOUNTS = [
  { login: "student", role: "Foydalanuvchi", icon: Users, description: "O'quvchi, o'qituvchi va xodimlar uchun" },
  { login: "kitobmanager", role: "Kitob menejeri", icon: BookOpen, description: "Kitoblar va kategoriyalar boshqaruvi" },
  { login: "admin", role: "Administrator", icon: KeyRound, description: "To'liq boshqaruv" },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [loadingLogin, setLoadingLogin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(roleHome(user.role));
    }
  }, [isAuthenticated, router, user]);

  function goToPanel() {
    const current = useAuthStore.getState().user;
    router.push(current ? roleHome(current.role) : "/home");
  }

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
    goToPanel();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    if (!username.trim() || !password) {
      setError("Login va parolni kiriting");
      return;
    }

    setSubmitting(true);
    setError(null);
    const ok = await login(username.trim(), password);
    setSubmitting(false);

    if (!ok) {
      setError("Login yoki parol noto'g'ri. Qayta urinib ko'ring.");
      return;
    }
    goToPanel();
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
            Foydalanuvchilar
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tizimga kirish uchun hisobingizni tanlang
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
                </span>
              </Button>
            );
          })}
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          yoki login va parol bilan
          <span className="h-px flex-1 bg-border" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full space-y-3 rounded-3xl border bg-card p-6 shadow-xl shadow-black/5"
        >
          <div className="space-y-1.5">
            <Label htmlFor="username">Login</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              placeholder="masalan: student"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Parol</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="h-11 rounded-xl"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-xl"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            Kirish
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          MBSI Library © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}