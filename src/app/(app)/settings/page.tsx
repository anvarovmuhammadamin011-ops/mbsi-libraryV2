"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
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
  Lock,
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react";

type Language = "uz" | "en";

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  const [language, setLanguage] = useState<Language>("uz");
  const [notifications, setNotifications] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setAvatar(user.avatar ?? "");
    }
    const savedLang = localStorage.getItem("mbsi-lang") as Language | null;
    if (savedLang) setLanguage(savedLang);
  }, [user]);

  function applyLanguage(l: Language) {
    setLanguage(l);
    localStorage.setItem("mbsi-lang", l);
  }

  async function save() {
    if (!name.trim()) {
      toast.error("Ism bo'sh bo'lmasligi kerak");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.patch<typeof user>("/api/profile", {
        name,
        avatar,
      });
      setUser(updated as any);
      toast.success("Profil saqlandi");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (!currentPassword || !newPassword) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Yangi parol kamida 6 ta belgi bo'lishi kerak");
      return;
    }
    setChangingPassword(true);
    try {
      await api.post("/api/profile/password", {
        currentPassword,
        newPassword,
      });
      toast.success("Parol yangilandi");
      setCurrentPassword("");
      setNewPassword("");
    } catch (e: any) {
      toast.error(e.message || "Parol o'zgartirishda xatolik");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto space-y-6 animate-fade-in pb-20 md:pb-0">
      <div>
        <h1 className="text-xl font-bold text-foreground">⚙️ Sozlamalar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ilova va profil sozlamalari
        </p>
      </div>


      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">🌍 Til</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {([
              { value: "uz" as Language, label: "🇺🇿 O'zbek", flag: "🇺🇿" },
              { value: "en" as Language, label: "🇬🇧 English", flag: "🇬🇧" },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => applyLanguage(opt.value)}
                className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                  language === opt.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="text-lg">{opt.flag}</span>
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">🔔 Bildirishnomalar</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Push bildirishnomalar</p>
              <p className="text-xs text-muted-foreground">Yangi xabarlar haqida ogohlantirish</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                notifications ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  notifications ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Reading */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">📖 O&apos;qish</h2>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Shrift kattaligi</p>
                <p className="text-xs text-muted-foreground">{fontSize}px</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                  className="h-8 w-8 rounded-lg bg-muted text-sm font-bold hover:bg-muted/80"
                >
                  A-
                </button>
                <span className="w-10 text-center text-sm font-medium">{fontSize}</span>
                <button
                  onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                  className="h-8 w-8 rounded-lg bg-muted text-sm font-bold hover:bg-muted/80"
                >
                  A+
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Lock size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">🔐 Xavfsizlik</h2>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="current-pw">Joriy parol</Label>
              <div className="relative">
                <Input
                  id="current-pw"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-pw">Yangi parol</Label>
              <Input
                id="new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Kamida 6 ta belgi"
              />
            </div>
            <Button
              variant="outline"
              onClick={changePassword}
              disabled={changingPassword}
            >
              {changingPassword ? "O'zgartirilmoqda…" : "Parolni o'zgartirish"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={logout}
      >
        <LogOut size={16} className="mr-2" />
        Tizimdan chiqish
      </Button>
    </div>
  );
}
