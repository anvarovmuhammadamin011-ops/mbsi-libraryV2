"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Trophy,
  Heart,
  Bookmark,
  Clock,
  User,
  LayoutDashboard,
  Library,
  Users,
  Tag,
  Star,
  Settings,
  Shield,
  FileText,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/auth-store";
import { useState } from "react";

const studentNav = [
  { label: "Bosh sahifa", href: "/home", icon: Home },
  { label: "Kitoblar", href: "/books", icon: Library },
  { label: "Reyting", href: "/ranking", icon: Trophy },
  { label: "Sevimlilar", href: "/favorites", icon: Heart },
  { label: "Xatcho'plar", href: "/bookmarks", icon: Bookmark },
  { label: "Davom ettirish", href: "/continue-reading", icon: Clock },
  { label: "Profil", href: "/profile", icon: User },
  { label: "Sozlamalar", href: "/settings", icon: Settings },
];

const adminNav = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Kitoblar", href: "/admin/books", icon: Library },
  { label: "Mualliflar", href: "/admin/authors", icon: Users },
  { label: "Kategoriyalar", href: "/admin/categories", icon: Tag },
  { label: "Foydalanuvchilar", href: "/admin/users", icon: Users },
  { label: "Reytinglar", href: "/admin/ratings", icon: Star },
  { label: "Tavsiyalar", href: "/admin/recommendations", icon: TrendingUp },
  { label: "Bannerlar", href: "/admin/banners", icon: FileText },
  { label: "Statistika", href: "/admin/statistics", icon: TrendingUp },
  { label: "Audit Log", href: "/admin/audit-log", icon: Shield },
  { label: "Sozlamalar", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";
  const navItems = isAdmin ? adminNav : studentNav;

  const roleLabel =
    user.role === "ADMIN"
      ? "Admin"
      : user.role === "TEACHER"
        ? "O'qituvchi"
        : "O'quvchi";

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-border bg-card transition-all duration-200",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <Link href="/home" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              MBSI
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3 px-2">
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/home" && item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon
                  size={18}
                  className={cn(
                    "shrink-0",
                    isActive ? "text-primary" : ""
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {user.name?.charAt(0)}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {roleLabel}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <LogOut size={14} />
              </Button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
