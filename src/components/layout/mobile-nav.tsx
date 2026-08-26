"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Search", href: "/search", icon: Search },
  { label: "My Library", href: "/library", icon: Library },
  { label: "Profile", href: "/profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/home" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-colors min-w-[52px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
