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
          "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors min-w-[56px]",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden safe-area-bottom">
      <div className="flex items-end justify-around px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {NAV_LEFT.map(renderItem)}

        {/* ═══ AI center button — iOS-style frosted glass ═══ */}
        <Link
          href="/ai-suggest"
          aria-label="AI"
          className="flex flex-col items-center gap-0.5 min-w-[64px] -mt-6"
        >
          <span
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full border shadow-lg backdrop-blur-xl transition-all active:scale-95",
              isAiActive
                ? "border-violet-400/60 bg-violet-600/80 text-white shadow-violet-500/30"
                : "border-white/50 bg-white/60 text-violet-600 shadow-black/10 dark:border-white/10 dark:bg-slate-800/60 dark:text-violet-300 dark:shadow-black/40"
            )}
          >
            <Sparkles size={24} strokeWidth={2.25} />
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
