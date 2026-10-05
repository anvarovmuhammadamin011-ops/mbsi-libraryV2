"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Palette, Sun, Moon, Monitor } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

// Profil sahifasidagi mavzu tanlovi (ko'chirildi: mobil footer'dan).
export function ProfileThemeCard() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const options = [
    { value: "light" as Theme, label: t.profile.themeLight, icon: Sun },
    { value: "dark" as Theme, label: t.profile.themeDark, icon: Moon },
    { value: "system" as Theme, label: t.profile.themeSystem, icon: Monitor },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm px-4 py-4">
      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Palette size={14} className="text-primary" /> {t.profile.theme}
      </h2>

      <div
        role="radiogroup"
        aria-label={t.profile.theme}
        className="grid grid-cols-3 gap-3"
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = mounted && theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={!mounted}
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
                isActive
                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/30"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
                !mounted && "opacity-50"
              )}
            >
              <Icon size={18} />
              <span className="text-xs font-medium">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
