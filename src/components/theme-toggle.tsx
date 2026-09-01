"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[Sun, Moon, Monitor].map((Icon, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 opacity-50"
          >
            <Icon size={20} />
            <span className="text-xs font-medium">...</span>
          </div>
        ))}
      </div>
    );
  }

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "🌞 Yorug'", icon: Sun },
    { value: "dark", label: "🌙 Qorong'u", icon: Moon },
    { value: "system", label: "🖥 Tizim", icon: Monitor },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map((opt) => {
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
              theme === opt.value
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
