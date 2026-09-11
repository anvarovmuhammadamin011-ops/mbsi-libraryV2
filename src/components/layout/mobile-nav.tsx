"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-provider";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

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
            ? "bg-primary/10 text-primary dark:text-blue-300"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        )}
      >
        <Icon size={22} strokeWidth={isActive ? 2.25 : 2} />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
      <div className="flex items-center justify-around rounded-[28px] border border-white/50 bg-white/60 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/40">
        {NAV_ITEMS.map(renderItem)}
      </div>
    </nav>
  );
}
