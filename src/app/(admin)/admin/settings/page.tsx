"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Info, Shield, BookOpen, Send, Database, Loader2 } from "lucide-react";
import { MAX_ACTIVE_BOOKS } from "@/types";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [tgConfigured, setTgConfigured] = useState<boolean | null>(null);
  const [tgSending, setTgSending] = useState(false);
  const [demoBusy, setDemoBusy] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/api/admin/telegram/test")
      .then((r: any) => setTgConfigured(Boolean(r?.configured)))
      .catch(() => setTgConfigured(false));
  }, []);

  async function sendTest() {
    setTgSending(true);
    try {
      await api.post("/api/admin/telegram/test", {});
      toast.success("Sinov xabari yuborildi");
    } catch (e: any) {
      toast.error(e.message || "Yuborilmadi");
    } finally {
      setTgSending(false);
    }
  }

  async function demoAction(action: string, label: string) {
    if (
      !confirm(
        "⚠️ Ogohlantirish!\nBu amal qaytarilib bo'lmaydi. Rostan ham bajarmoqchimisiz?"
      )
    )
      return;
    setDemoBusy(action);
    try {
      const res: any = await api.post("/api/admin/data/demo", { action });
      toast.success(
        action === "reset"
          ? "Demo ma'lumotlar qayta yuklandi"
          : `${label}: ${res?.deleted ?? 0} ta o'chirildi`
      );
    } catch (e: any) {
      toast.error(e.message || "Xatolik");
    } finally {
      setDemoBusy(null);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sozlamalar</h1>
        <p className="text-sm text-muted-foreground mt-1">Tizim sozlamalari</p>
      </div>

      {/* Appearance */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          {theme === "dark" ? <Moon size={16} className="text-primary" /> : <Sun size={16} className="text-primary" />}
          <h2 className="text-base font-semibold">Ko&apos;rinish</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Mavzu</p>
            <p className="text-xs text-muted-foreground">Yorug&apos; va tungi rejim o&apos;rtasida almashtiring</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "Yorug' rejim" : "Tungi rejim"}
          </Button>
        </div>
      </div>

      {/* Reading */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-primary" />
          <h2 className="text-base font-semibold">O&apos;qish</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Maksimal faol kitoblar</p>
              <p className="text-xs text-muted-foreground">Foydalanuvchi bir vaqtda o&apos;qiy oladigan maksimal kitoblar soni</p>
            </div>
            <span className="text-sm font-semibold text-primary">{MAX_ACTIVE_BOOKS}</span>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-primary" />
          <h2 className="text-base font-semibold">Xavfsizlik</h2>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Barcha admin API endpointlari server tomonda rol tekshiruvi bilan himoyalangan.
          </p>
          <p className="text-sm text-muted-foreground">
            Admin sahifalariga kirishga urinayotgan O&apos;quvchi/O&apos;qituvchi foydalanuvchilarga 403 Forbidden qaytariladi.
          </p>
        </div>
      </div>

      {/* Telegram Bot */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Send size={16} className="text-primary" />
          <h2 className="text-base font-semibold">Telegram Bot</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Admin bildirishnomalar</p>
              <p className="text-xs text-muted-foreground">
                {tgConfigured === null
                  ? "Tekshirilmoqda..."
                  : tgConfigured
                    ? "Ulangan — yangi o'quvchi/kitob/kategoriya haqida xabar boradi"
                    : "Ulanmagan — TELEGRAM_BOT_TOKEN va TELEGRAM_ADMIN_CHAT_ID ni env ga qo'shing"}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                tgConfigured
                  ? "bg-green-500/10 text-green-600"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {tgConfigured === null
                ? "..."
                : tgConfigured
                  ? "Faol"
                  : "O'chiq"}
            </span>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Bildirishnoma turlari:</p>
            <p>☑️ Yangi o&apos;quvchi ☑️ Yangi kitob ☑️ Yangi kategoriya ☑️ Xavf signallari</p>
            <p className="mt-1">
              Token kodga yozilmaydi — faqat server env o&apos;zgaruvchilarida saqlanadi.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={sendTest}
            disabled={!tgConfigured || tgSending}
            className="gap-2"
          >
            {tgSending && <Loader2 className="size-3.5 animate-spin" />}
            Sinov xabari yuborish
          </Button>
        </div>
      </div>

      {/* Data Management */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database size={16} className="text-primary" />
          <h2 className="text-base font-semibold">Data Management</h2>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">Barcha demo kitoblarni o&apos;chirish</p>
            <Button
              variant="outline"
              size="sm"
              disabled={demoBusy !== null}
              onClick={() => demoAction("delete-books", "Demo kitoblar")}
            >
              {demoBusy === "delete-books" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "O'chirish"
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">Barcha demo o&apos;quvchilarni o&apos;chirish</p>
            <Button
              variant="outline"
              size="sm"
              disabled={demoBusy !== null}
              onClick={() => demoAction("delete-students", "Demo o'quvchilar")}
            >
              {demoBusy === "delete-students" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "O'chirish"
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">Demo ma&apos;lumotlarni qayta yuklash</p>
            <Button
              variant="outline"
              size="sm"
              disabled={demoBusy !== null}
              onClick={() => demoAction("reset", "Reset")}
            >
              {demoBusy === "reset" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Qayta yuklash"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-primary" />
          <h2 className="text-base font-semibold">Ilova haqida</h2>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">MBSI Library v0.2.0</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            MBSI maktabining raqamli kutubxonasi. 500+ kitob, 560+ foydalanuvchi.
            Kelajakda MBSI Online Kundalik tizimi bilan SSO integratsiya qilinadi.
          </p>
        </div>
      </div>
    </div>
  );
}
