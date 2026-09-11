"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookMarked,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Tags,
  MessageSquare,
  UserPlus,
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
}

// Admin navigation: Dashboard, Kitoblar, Kategoriyalar, O'quvchilar, Yangi o'quvchi, Sharhlar, Sozlamalar
const NAV_ITEMS: NavItem[] = [
  { label: "Boshqaruv paneli", href: "/admin", icon: LayoutDashboard },
  { label: "Kitoblar", href: "/admin/books", icon: BookMarked },
  { label: "Kategoriyalar", href: "/admin/categories", icon: Tags },
  { label: "O'quvchilar", href: "/admin/students", icon: Users },
  { label: "Yangi o'quvchi", href: "/admin/students/new", icon: UserPlus },
  { label: "Sharhlar", href: "/admin/reviews", icon: MessageSquare },
  { label: "Sozlamalar", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  return (
    <>
      {/* ─── Mobile top navigation (lg:hidden) ─── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/logo/school-logo.svg"
              alt="MBSI Logo"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="text-sm font-bold tracking-tight text-foreground leading-none">
              MBSI LIBRARY
            </span>
          </Link>
          <button
            onClick={logout}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Chiqish"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2.5 scrollbar-thin">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-card transition-all duration-200",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image
              src="/logo/school-logo.svg"
              alt="MBSI Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground leading-none">
                MBSI LIBRARY
              </span>
              <span className="text-[10px] font-medium text-primary leading-none mt-0.5">
                Admin paneli
              </span>
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? "Kengaytirish" : "Kichraytirish"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </Button>
      </div>

      {/* Navigation — Phase 1: Dashboard, Books, Users, Settings */}
      <ScrollArea className="flex-1 py-3 px-2">
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
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
                  Admin
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Chiqish"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              </Button>
            </>
          )}
        </div>
      </div>
      </aside>
    </>
  );
}
