"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Trophy, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Books", href: "/books", icon: BookOpen },
  { label: "Ranking", href: "/ranking", icon: Trophy },
  { label: "Favorites", href: "/favorites", icon: Heart },
  { label: "Profile", href: "/profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur-sm lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {mobileNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
