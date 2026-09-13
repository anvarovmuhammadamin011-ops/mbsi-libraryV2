"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/lib/auth-store";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { Lang } from "@/lib/i18n/dictionaries";
import { roleHome } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  BookOpen,
  Eye,
  EyeOff,
  KeyRound,
  AtSign,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Sun,
  Moon,
  Languages,
  GraduationCap,
  BookMarked,
  Library,
} from "lucide-react";

const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "uz", label: "O'zbekcha", short: "UZ" },
  { code: "ru", label: "Русский", short: "RU" },
  { code: "en", label: "English", short: "EN" },
];

const FEATURES = [
  { icon: Library, key: "library" },
  { icon: GraduationCap, key: "progress" },
  { icon: BookMarked, key: "bookmarks" },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { t, lang, setLang } = useLanguage();
  const { theme, setTheme } = useTheme();
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
      router.replace(roleHome(user.role));
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
      setError(t.login.invalidCredentials);
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
      return;
    }
    // login muvaffaqiyatli — user store'ga yozildi, roleHome'ga yo'naltiramiz
    const u = useAuthStore.getState().user;
    if (u) router.push(roleHome(u.role));
  }

  const featureLabels: Record<(typeof FEATURES)[number]["key"], string> = {
    library: t.login.featureLibrary,
    progress: t.login.featureProgress,
    bookmarks: t.login.featureBookmarks,
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 sm:p-6 lg:grid lg:grid-cols-2 lg:justify-start lg:gap-0 lg:p-0">
      {/* ─── Chap panel: brand + featurelar (faqat desktop) ─── */}
      <aside className="relative hidden h-screen flex-col justify-between overflow-hidden bg-[#0B1121] p-10 text-white lg:flex xl:p-14">
        {/* Fon effektlari */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />
          <div className="absolute bottom-[-8rem] right-[-6rem] h-[26rem] w-[26rem] rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute left-1/3 top-1/4 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
          {/* Nozik grid naqsh */}
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
        </div>

        {/* Yuqori qism: logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">MBSI Library</p>
            <p className="text-xs text-white/60">{t.login.brandTagline}</p>
          </div>
        </div>

        {/* O'rta qism: katta sarlavha + featurelar */}
        <div className="relative">
          <h2 className="max-w-md text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            {t.login.heroTitle}
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
            {t.login.heroSubtitle}
          </p>

          <ul className="mt-10 space-y-4">
            {FEATURES.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                  <Icon className="h-5 w-5 text-amber-300" />
                </span>
                <span className="text-sm font-medium text-white/85">
                  {featureLabels[key]}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pastki qism: statistika */}
        <div className="relative flex items-center gap-8 text-sm">
          <div>
            <p className="text-2xl font-bold">24+</p>
            <p className="text-white/60">{t.login.statBooks}</p>
          </div>
          <div className="h-10 w-px bg-white/15" />
          <div>
            <p className="text-2xl font-bold">100%</p>
            <p className="text-white/60">{t.login.statFree}</p>
          </div>
          <div className="h-10 w-px bg-white/15" />
          <div>
            <p className="text-2xl font-bold">24/7</p>
            <p className="text-white/60">{t.login.statAccess}</p>
          </div>
        </div>
      </aside>

      {/* ─── O'ng panel: forma ─── */}
      <div className="relative flex w-full flex-col items-center justify-center lg:h-screen">
        {/* Mobil fon dekoratsiyalari */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 lg:hidden"
        >
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        {/* Yuqori panel: til va tema */}
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-6 sm:top-6">
          {/* Til almashtirish */}
          <div className="flex items-center gap-0.5 rounded-full border bg-card/80 p-1 shadow-sm backdrop-blur">
            <Languages className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                aria-label={l.label}
                aria-pressed={lang === l.code}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  lang === l.code
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.short}
              </button>
            ))}
          </div>

          {/* Tema almashtirish */}
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={t.login.toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full border bg-card/80 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </button>
        </div>

        <div className="relative w-full max-w-md animate-fade-in px-1 py-16 lg:px-8">
          {/* Mobil logo */}
          <div className="mb-8 flex flex-col items-center gap-4 lg:hidden">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25">
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

          {/* Desktop sarlavha */}
          <div className="mb-8 hidden lg:block">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t.login.badgeNew}
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t.login.welcome}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.login.subtitle}
            </p>
          </div>

          {/* Login formasi */}
          <form
            onSubmit={handleSubmit}
            className={`rounded-3xl border bg-card/80 p-6 shadow-xl shadow-black/5 backdrop-blur sm:p-8 ${
              shake ? "animate-shake" : ""
            }`}
          >
            {error && (
              <div
                role="alert"
                className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Login */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  {t.login.username}
                </Label>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                    placeholder={t.login.usernamePlaceholder}
                    className="h-12 rounded-xl bg-background pl-10 pr-4 text-base"
                  />
                </div>
              </div>

              {/* Parol */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t.login.password}
                </Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                    placeholder={t.login.passwordPlaceholder}
                    className="h-12 rounded-xl bg-background pl-10 pr-11 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? t.login.hidePassword : t.login.showPassword
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Kirish tugmasi */}
              <Button
                type="submit"
                disabled={loading || !username.trim() || !password}
                className="group h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/25 transition-transform active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.login.loggingIn}
                  </>
                ) : (
                  <>
                    {t.login.enter}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            MBSI Library © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
