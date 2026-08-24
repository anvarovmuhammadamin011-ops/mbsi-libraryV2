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
import { MBSILogo } from "@/components/mbsi-logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/auth-store";
import { useState } from "react";

// ─── Navigation Items ───────────────────────────────────────
const studentNav = [
  { label: "Bosh sahifa", href: "/home", icon: Home },
  { label: "Kitoblar", href: "/books", icon: Library },
  { label: "Reyting", href: "/ranking", icon: Trophy },
  { label: "Sevimlilar", href: "/favorites", icon: Heart },
  { label: "Bookmarklar", href: "/bookmarks", icon: Bookmark },
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

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && <MBSILogo size="sm" />}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 shrink-0"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="flex flex-col gap-0.5 px-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon size={18} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User */}
      <Separator />
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {user.name.charAt(0)}
        </div>
        {!collapsed && (
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.role === "ADMIN"
                ? "Admin"
                : user.role === "TEACHER"
                  ? "O'qituvchi"
                  : "O'quvchi"}
            </p>
          </div>
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          >
            <LogOut size={16} />
          </Button>
        )}
      </div>
    </aside>
  );
}
