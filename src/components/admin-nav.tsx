"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookMarked, Users, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Umumiy", icon: LayoutDashboard },
  { href: "/admin/books", label: "Kitoblar", icon: BookMarked },
  { href: "/admin/categories", label: "Kategoriyalar", icon: Tags },
  { href: "/admin/users", label: "Foydalanuvchilar", icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-2">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="size-4" />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
