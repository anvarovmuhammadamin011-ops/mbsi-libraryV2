"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Info, Shield, BookOpen } from "lucide-react";
import { MAX_ACTIVE_BOOKS } from "@/types";

export default function AdminSettingsPage() {
  const { theme, setTheme } = useTheme();

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
