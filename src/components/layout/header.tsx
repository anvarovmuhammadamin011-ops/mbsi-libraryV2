"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun, Search, Menu, LogOut, User, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/auth-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const pageTitles: Record<string, string> = {
  "/home": "Bosh sahifa",
  "/books": "Kitoblar",
  "/ranking": "Reyting",
  "/favorites": "Sevimlilar",
  "/bookmarks": "Xatcho'plar",
  "/continue-reading": "Davom ettirish",
  "/profile": "Profil",
  "/settings": "Sozlamalar",
  "/search": "Qidiruv",
  "/admin": "Admin panel",
  "/admin/books": "Kitoblar boshqaruvi",
  "/admin/categories": "Kategoriyalar",
  "/admin/users": "Foydalanuvchilar",
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const title = pageTitles[pathname] || "MBSI Library";

  function onSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const q = (e.target as HTMLInputElement).value.trim();
      router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/books");
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-4 lg:px-6">
      {/* Mobile logo */}
      <div className="lg:hidden">
        <Link href="/home" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-white">M</span>
          </div>
        </Link>
      </div>

      {/* Page title (desktop) */}
      <div className="hidden lg:block">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Kitob, muallif qidiring…"
          className="h-10 pl-9 bg-muted/50 border-transparent focus:border-primary/20 focus:bg-card"
          onKeyDown={onSearch}
        />
      </div>

      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Sun size={17} className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon size={17} className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Mavzuni almashtirish</span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-9 gap-2 px-2" />}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {user.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="flex items-center gap-3 p-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {user.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user.role === "ADMIN" ? "Admin" : user.role === "TEACHER" ? "O'qituvchi" : "O'quvchi"}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/profile" className="flex items-center gap-2" />}>
              <User size={14} />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-destructive">
              <LogOut size={14} />
              Chiqish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
