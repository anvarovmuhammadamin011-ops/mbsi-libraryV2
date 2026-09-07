"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-provider";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const NAV_LEFT = [
    { label: t.nav.home, href: "/home", icon: Home },
    { label: t.nav.search, href: "/search", icon: Search },
  ];
  const NAV_RIGHT = [
    { label: t.nav.library, href: "/library", icon: Library },
    { label: t.nav.profile, href: "/profile", icon: User },
  ];
  const isAiActive = pathname === "/ai-suggest";

  const renderItem = (item: { label: string; href: string; icon: typeof Home }) => {
    const isActive =
      pathname === item.href ||
      (item.href !== "/home" && pathname.startsWith(item.href));
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex min-w-[56px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-medium transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground"
        )}
      >
        <Icon size={22} strokeWidth={2} />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
      <div className="flex items-end justify-around rounded-[28px] border border-white/50 bg-white/60 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/40">
        {NAV_LEFT.map(renderItem)}

        {/* ═══ AI center button — iOS-style frosted glass ═══ */}
        <Link
          href="/ai-suggest"
          aria-label="AI"
          className="flex min-w-[64px] flex-col items-center gap-1 -mt-9"
        >
          <span
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full border shadow-lg backdrop-blur-xl transition-all active:scale-95",
              isAiActive
                ? "border-violet-400/60 bg-violet-600/80 text-white shadow-violet-500/30"
                : "border-white/50 bg-white/70 text-violet-600 shadow-black/10 dark:border-white/10 dark:bg-slate-800/70 dark:text-violet-300 dark:shadow-black/40"
            )}
          >
            <Sparkles size={24} strokeWidth={2} />
          </span>
          <span
            className={cn(
              "text-[11px] font-semibold",
              isAiActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            AI
          </span>
        </Link>

        {NAV_RIGHT.map(renderItem)}
      </div>
    </nav>
  );
}
