"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace("/home");
    }
  }, [isAuthenticated, router, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password || loading) return;
    setLoading(true);
    setError(null);
    const ok = await login(username.trim(), password);
    setLoading(false);
    if (!ok) {
      setError("Login yoki parol noto'g'ri");
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
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
            Login va parolni kiriting
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

        {/* Login formasi */}
        <form
          onSubmit={handleSubmit}
          className={`w-full rounded-3xl border bg-card p-6 shadow-xl shadow-black/5 ${
            shake ? "animate-shake" : ""
          }`}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium">
                Foydalanuvchi nomi{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Foydalanuvchi nomini kiriting"
                className="h-12 rounded-xl bg-background text-base"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Parol <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Parolni kiriting"
                  className="h-12 rounded-xl bg-background pr-11 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/25 transition-transform active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kirilmoqda...
                </>
              ) : (
                "Tizimga kirish"
              )}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          MBSI Library © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
