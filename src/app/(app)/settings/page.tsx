"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/lib/auth-store";
import { useLanguage } from "@/lib/i18n/language-provider";
import { LANGS, type Lang } from "@/lib/i18n/dictionaries";
import { api } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Globe,
  Bell,
  BookOpen,
  Moon,
  Sun,
  LogOut,
  Settings,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [notifications, setNotifications] = useState(true);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
    }
  }, [user]);

  function applyLanguage(l: Lang) {
    setLang(l);
    toast.success(t.settings.langChanged);
    router.refresh();
  }

  async function save() {
    if (!name.trim()) {
      toast.error(t.settings.nameEmpty);
      return;
    }
    setSaving(true);
    try {
      const updated = await api.patch<typeof user>("/api/profile", {
        name,
      });
      setUser(updated as any);
      toast.success(t.settings.profileSaved);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  const isDark = mounted && theme === "dark";

  return (
    <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto space-y-8 animate-fade-in pb-28 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings size={22} className="text-primary" />
          {t.settings.title}
        </h1>
        <p className="text-sm text-muted-foreground/80 mt-1.5">
          {t.settings.subtitle}
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16 border border-border">
              {user?.avatar ? (
                <AvatarImage src={user.avatar} alt={name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                {name?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <Label htmlFor="profile-name">{t.settings.name}</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
            {saving ? t.settings.saving : t.settings.save}
          </Button>
        </CardContent>
      </Card>

      {/* Language — radio-style cards */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">{t.settings.language}</h2>
          </div>

          <div
            role="radiogroup"
            aria-label={t.settings.language}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {LANGS.map((opt) => {
              const active = lang === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => applyLanguage(opt.value as Lang)}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition-all ${
                    active
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0" aria-hidden>{opt.flag}</span>
                    <span className={`text-sm font-medium truncate ${active ? "text-primary" : "text-foreground"}`}>
                      {opt.label}
                    </span>
                  </span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                    }`}
                    aria-hidden
                  >
                    {active && <Check size={12} strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Appearance — dark mode toggle */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-primary">
              {isDark ? <Moon size={16} /> : <Sun size={16} />}
            </span>
            <h2 className="text-sm font-semibold text-foreground">{t.settings.appearance}</h2>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{t.settings.darkMode}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.settings.darkModeSub}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                isDark ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  isDark ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">{t.settings.notifications}</h2>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{t.settings.notifTitle}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.settings.notifSub}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifications}
              onClick={() => setNotifications(!notifications)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                notifications ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  notifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
      </CardContent>
      </Card>

      {/* Reading */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">{t.settings.reading}</h2>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{t.settings.fontSize}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{fontSize}px</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                className="h-9 w-9 rounded-lg bg-muted text-sm font-bold hover:bg-muted/80 transition-colors"
                aria-label="-"
              >
                A−
              </button>
              <span className="w-10 text-center text-sm font-medium">{fontSize}</span>
              <button
                type="button"
                onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                className="h-9 w-9 rounded-lg bg-muted text-sm font-bold hover:bg-muted/80 transition-colors"
                aria-label="+"
              >
                A+
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout — destructive action, clearly separated at the bottom */}
      <div className="pt-2 border-t border-border">
        <Button
          variant="destructive"
          className="w-full h-11 text-sm font-semibold"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          {t.settings.logout}
        </Button>
      </div>
    </div>
  );
}
