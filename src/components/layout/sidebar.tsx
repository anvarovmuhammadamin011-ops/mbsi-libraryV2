"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Home,
  BookMarked,
  User,
  LogOut,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Shield,
  Search,
  Library,
  Target,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/lib/auth-store";
import { useState, useEffect } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Bosh sahifa", href: "/home", icon: Home },
  { label: "Qidiruv", href: "/search", icon: Search },
  { label: "Kitoblar", href: "/books", icon: BookMarked },
  { label: "Kutubxonam", href: "/library", icon: Library },
  { label: "Shaxsiy reja", href: "/plan", icon: Target },
  { label: "Profil", href: "/profile", icon: User },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  return (
    <>
      {/* ═══ TABLET SIDEBAR (md to lg) — icon only ═══ */}
      <aside className="hidden md:flex lg:hidden flex-col border-r border-border bg-card w-[72px]">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-border">
          <Link href="/home" className="flex items-center justify-center">
            <Image
              src="/logo/school-logo.svg"
              alt="MBSI Logo"
              width={36}
              height={36}
              className="rounded-lg"
            />
          </Link>
        </div>

        {/* Navigation — icon only, larger touch targets */}
        <nav className="flex-1 flex flex-col items-center gap-1 py-4 px-1.5">
          {NAV_ITEMS.map((item) => {
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

        {/* Theme toggle */}
        <div className="px-1.5 pb-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-12 w-12 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            aria-label="Mavzuni almashtirish"
          >
            {mounted && theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
          </button>
        </div>

        {/* Admin link (if admin) */}
        {isAdmin && (
          <div className="px-1.5 pb-2">
            <Link
              href="/admin"
              title="Admin paneli"
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

      {/* ═══ DESKTOP SIDEBAR (lg+) — full labels ═══ */}
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
              <Image
                src="/logo/school-logo.svg"
                alt="MBSI Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-foreground leading-none">
                  MBSI
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
            aria-label={collapsed ? "Kengaytirish" : "Kichraytirish"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3 px-2">
          <nav className="flex flex-col gap-0.5">
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
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Theme toggle */}
        <div className="px-2 pb-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 w-full",
              "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-label="Mavzuni almashtirish"
          >
            {mounted && theme === "dark" ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
            {!collapsed && <span className="flex-1 text-left">
              {mounted ? (theme === "dark" ? "Yorug' mavzu" : "Qorong'u mavzu") : "Mavzu"}
            </span>}
          </button>
        </div>

        {/* Admin link (if admin) */}
        {isAdmin && !collapsed && (
          <div className="px-2 pb-2">
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <Shield size={18} className="shrink-0" />
              <span>Admin paneli</span>
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
