"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun, Search, Menu, LogOut, User, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MBSILogo } from "@/components/mbsi-logo";
import { useAuthStore } from "@/lib/auth-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  function onSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const q = (e.target as HTMLInputElement).value.trim();
      router.push(q ? `/books?q=${encodeURIComponent(q)}` : "/books");
    }
  }

  const roleBadge =
    user.role === "ADMIN"
      ? "Admin"
      : user.role === "TEACHER"
        ? "O'qituvchi"
        : "O'quvchi";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:px-6">
      {/* Mobile menu */}
      <Button variant="ghost" size="icon" className="lg:hidden">
        <Menu size={20} />
      </Button>

      {/* Mobile logo */}
      <div className="lg:hidden">
        <MBSILogo size="sm" showText={false} />
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Kitob, muallif yoki kategoriya qidiring…"
          className="pl-9 bg-muted/50"
          onKeyDown={onSearch}
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun size={18} className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon size={18} className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-9 gap-2 px-2" />}>
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium leading-none">{user.name.split(" ")[0]}</span>
                <Badge variant="secondary" className="mt-0.5 h-4 px-1.5 text-[10px]">
                  {roleBadge}
                </Badge>
              </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{roleBadge}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/profile" className="flex items-center gap-2" />}
            >
              <User size={14} />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="flex items-center gap-2 text-destructive"
            >
              <LogOut size={14} />
              Chiqish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
