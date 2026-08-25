"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookMarked,
  Tags,
  Users,
  Star,
  BarChart3,
  Trophy,
  Settings,
  FileText,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BookOpenCheck,
  Target,
  ClipboardList,
  Bell,
  GraduationCap,
  FileBarChart,
  Image,
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

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Umumiy ko'rinish",
    items: [{ label: "Boshqaruv paneli", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "Kutubxona",
    items: [
      { label: "Kitoblar", href: "/admin/books", icon: BookMarked },
      { label: "Kategoriyalar", href: "/admin/categories", icon: Tags },
      { label: "Mualliflar", href: "/admin/authors", icon: Users },
      { label: "Tavsiyalar", href: "/admin/recommendations", icon: Star },
      { label: "Bannerlar", href: "/admin/banners", icon: Image },
    ],
  },
  {
    title: "Foydalanuvchilar",
    items: [
      { label: "Foydalanuvchilar", href: "/admin/users", icon: Users },
      { label: "Ustozlar", href: "/admin/teachers", icon: GraduationCap },
    ],
  },
  {
    title: "Topshiriqlar",
    items: [
      { label: "Topshiriqlar", href: "/admin/assignments", icon: ClipboardList },
      { label: "Missiyalar", href: "/admin/missions", icon: Target },
    ],
  },
  {
    title: "Analitika",
    items: [
      { label: "Reyting", href: "/admin/ratings", icon: Trophy },
      { label: "Statistikalar", href: "/admin/statistics", icon: BarChart3 },
    ],
  },
  {
    title: "Tizim",
    items: [
      { label: "Bildirishnomalar", href: "/admin/notifications", icon: Bell },
      { label: "Hisobotlar", href: "/admin/reports", icon: FileBarChart },
      { label: "Audit jurnali", href: "/admin/audit-log", icon: FileText },
      { label: "Sozlamalar", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  return (
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BookOpenCheck className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground leading-none">
                ANVAROV LIBRARY
              </span>
              <span className="text-[10px] font-medium text-primary leading-none mt-0.5">
                Admin panel
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
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-4">
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.title}
              </p>
            )}
            <nav className="flex flex-col gap-0.5">
              {group.items.map((item) => {
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
          </div>
        ))}
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
