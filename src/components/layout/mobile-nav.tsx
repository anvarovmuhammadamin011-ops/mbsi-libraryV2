"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Home, Search, Library, User, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-provider";
import { useState, useEffect } from "react";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const NAV_ITEMS = [
    { label: t.nav.home, href: "/home", icon: Home },
    { label: t.nav.search, href: "/search", icon: Search },
    { label: t.nav.library, href: "/library", icon: Library },
    { label: t.nav.profile, href: "/profile", icon: User },
  ];

  const renderItem = (item: { label: string; href: string; icon: typeof Home }) => {
    const isActive =
      pathname === item.href ||
      (item.href !== "/home" && pathname.startsWith(item.href));
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex min-w-[56px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-medium transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon size={22} strokeWidth={isActive ? 2.25 : 2} />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
      <div className="flex items-center justify-between rounded-[28px] border border-border bg-card px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-around flex-1">
          {NAV_ITEMS.map(renderItem)}
        </div>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all ml-2"
          aria-label={t.header.themeToggle}
        >
          {mounted && theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </nav>
  );
}
