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
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">System configuration</p>
      </div>

      {/* Appearance */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          {theme === "dark" ? <Moon size={16} className="text-primary" /> : <Sun size={16} className="text-primary" />}
          <h2 className="text-base font-semibold">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </Button>
        </div>
      </div>

      {/* Reading */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-primary" />
          <h2 className="text-base font-semibold">Reading</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Max active books</p>
              <p className="text-xs text-muted-foreground">Maximum books a user can read simultaneously</p>
            </div>
            <span className="text-sm font-semibold text-primary">{MAX_ACTIVE_BOOKS}</span>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-primary" />
          <h2 className="text-base font-semibold">Security</h2>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            All admin API endpoints are protected with server-side role authorization.
          </p>
          <p className="text-sm text-muted-foreground">
            Student/Teacher users attempting to access admin routes receive 403 Forbidden.
          </p>
        </div>
      </div>

      {/* About */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-primary" />
          <h2 className="text-base font-semibold">About</h2>
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
