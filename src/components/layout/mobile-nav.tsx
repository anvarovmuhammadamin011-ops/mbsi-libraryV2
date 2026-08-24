"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { label: "Bosh sahifa", href: "/home", icon: Home },
  { label: "Kitoblar", href: "/books", icon: Library },
  { label: "Reyting", href: "/ranking", icon: Trophy },
  { label: "Profil", href: "/profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1.5">
        {mobileNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/home" && item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-[11px] font-medium transition-all duration-150",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
