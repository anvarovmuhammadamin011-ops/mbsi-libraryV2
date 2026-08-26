"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookMarked,
  Headphones,
  Target,
  Trophy,
  Coins,
  BarChart3,
  Heart,
  Clock,
  Bell,
  User,
  Settings,
  LogOut,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Shield,
  Search,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/lib/auth-store";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

// Tablet sidebar — simplified, touch-friendly
const TABLET_NAV: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Search", href: "/search", icon: Search },
  { label: "My Library", href: "/library", icon: Library },
  { label: "Saved", href: "/favorites", icon: Heart },
  { label: "History", href: "/history", icon: Clock },
  { label: "Settings", href: "/settings", icon: Settings },
];

// Desktop sidebar — full nav with groups
const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: "Bosh sahifa", href: "/home", icon: Home },
      { label: "Kitoblar", href: "/books", icon: BookMarked },
      { label: "Audio kitoblar", href: "/audio", icon: Headphones },
      { label: "Missiyalar", href: "/missions", icon: Target },
      { label: "Reyting", href: "/ranking", icon: Trophy },
      { label: "Coinlar va do'kon", href: "/coins", icon: Coins },
      { label: "Statistika", href: "/statistics", icon: BarChart3 },
      { label: "Saqlanganlar", href: "/favorites", icon: Heart },
      { label: "Tarix", href: "/history", icon: Clock },
    ],
  },
  {
    title: "Shaxsiy",
    items: [
      { label: "Bildirishnomalar", href: "/notifications", icon: Bell, badge: 3 },
      { label: "Profil", href: "/profile", icon: User },
      { label: "Sozlamalar", href: "/settings", icon: Settings },
    ],
  },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  return (
    <>
      {/* ═══ TABLET SIDEBAR (md to lg) ═══ */}
      <aside className="hidden md:flex lg:hidden flex-col border-r border-border bg-card w-[72px]">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-border">
          <Link href="/home" className="flex items-center justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </Link>
        </div>

        {/* Navigation — icon only, larger touch targets */}
        <nav className="flex-1 flex flex-col items-center gap-1 py-4 px-1.5">
          {TABLET_NAV.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/home" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-150",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon
                  size={22}
                  className={cn(isActive ? "text-primary" : "")}
                />
              </Link>
            );
          })}
        </nav>

        {/* Admin link (if admin) */}
        {isAdmin && (
          <div className="px-1.5 pb-2">
            <Link
              href="/admin"
              title="Admin panel"
              className="flex h-12 w-12 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <Shield size={22} />
            </Link>
          </div>
        )}

        {/* User avatar */}
        <div className="border-t border-border p-2 flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {user.name?.charAt(0)}
          </div>
        </div>
      </aside>

      {/* ═══ DESKTOP SIDEBAR (lg+) ═══ */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-card transition-all duration-200",
          collapsed ? "w-[68px]" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <Link href="/home" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-foreground leading-none">
                  ANVAROV
                </span>
                <span className="text-[10px] font-medium text-primary leading-none mt-0.5">
                  LIBRARY
                </span>
              </div>
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
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className="mb-4">
              {group.title && !collapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group.title}
                </p>
              )}
              <nav className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/home" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon
                        size={18}
                        className={cn("shrink-0", isActive ? "text-primary" : "")}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && item.badge > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </ScrollArea>

        {/* Admin link (if admin) */}
        {isAdmin && !collapsed && (
          <div className="px-2 pb-2">
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <Shield size={18} className="shrink-0" />
              <span>Admin panel</span>
            </Link>
          </div>
        )}

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
                  <p className="truncate text-xs text-muted-foreground capitalize">
                    {user.role === "STUDENT" ? "O'quvchi" : user.role === "TEACHER" ? "O'qituvchi" : "Admin"}
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
    </>
  );
}
