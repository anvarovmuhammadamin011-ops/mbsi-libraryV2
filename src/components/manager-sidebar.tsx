"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookMarked,
  Tags,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
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
  exact?: boolean;
}

// Kitob menejeri navigatsiyasi:
// Dashboard, Kitoblar, Kategoriyalar, Analitika
const NAV_ITEMS: NavItem[] = [
  { label: "Boshqaruv paneli", href: "/manager", icon: LayoutDashboard },
  { label: "Kitoblar", href: "/manager/books", icon: BookMarked },
  { label: "Kategoriyalar", href: "/manager/categories", icon: Tags },
  { label: "Analitika", href: "/manager/analytics", icon: BarChart3 },
];

function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return (
    pathname === item.href ||
    (item.href !== "/manager" && pathname.startsWith(item.href))
  );
}

export function ManagerSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  return (
    <>
      {/* ─── Mobile top navigation (lg:hidden) ─── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/manager" className="flex items-center gap-2">
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
            <LogOut size={15} />
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2.5 scrollbar-thin">
          {NAV_ITEMS.map((item) => {
            const isActive = isNavActive(pathname, item);
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
            <Link href="/manager" className="flex items-center gap-2.5">
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
                <span className="text-[10px] font-medium text-emerald-600 leading-none mt-0.5">
                  Kitob menejeri
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

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3 px-2">
          <nav className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = isNavActive(pathname, item);
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
                    className={cn("shrink-0", isActive ? "text-emerald-600" : "")}
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
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-600">
              {user.name?.charAt(0)}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Kitob menejeri
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Chiqish"
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
