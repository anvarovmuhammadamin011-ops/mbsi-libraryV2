"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat } from "@/components/ui/stat";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  UserCheck,
  Shield,
  Loader2,
  Trash2,
  BookOpen,
  Clock,
  Trophy,
  UserX,
  ChevronRight,
} from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
  bookCount: number;
  sessionCount: number;
  totalPages: number;
  readingTime: number;
  createdAt: string;
}

interface Props {
  users: UserRow[];
  currentUserId: string;
  stats: { total: number; students: number; teachers: number; admins: number };
}

const ROLE_TABS = [
  { value: "all", label: "Barchasi" },
  { value: "STUDENT", label: "O'quvchilar" },
  { value: "TEACHER", label: "O'qituvchilar" },
  { value: "ADMIN", label: "Adminlar" },
];

export function AdminUsersTable({ users, currentUserId, stats }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...users];
    if (q) {
      const lower = q.toLowerCase();
      result = result.filter((u) => u.name.toLowerCase().includes(lower));
    }
    if (role !== "all") result = result.filter((u) => u.role === role);
    if (status === "active") result = result.filter((u) => u.isActive);
    if (status === "inactive") result = result.filter((u) => !u.isActive);
    return result;
  }, [users, q, role, status]);

  async function toggleRole(id: string, current: string) {
    setBusy(id);
    try {
      const next = current === "TEACHER" ? "STUDENT" : "TEACHER";
      await api.patch(`/api/admin/users/${id}`, { role: next });
      toast.success(`Foydalanuvchi roli ${next} ga o'zgartirildi`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Rolni o'zgartirishda xatolik");
    } finally {
      setBusy(null);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    setBusy(id);
    try {
      await api.patch(`/api/admin/users/${id}`, { isActive: !current });
      toast.success(current ? "Foydalanuvchi bloklandi" : "Foydalanuvchi faollashtirildi");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Holatni o'zgartirishda xatolik");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Foydalanuvchilar</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          MBSI kutubxonasi foydalanuvchilarini boshqarish
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Jami" value={stats.total.toLocaleString()} icon={<Users className="size-5" />} />
        <Stat label="O'quvchilar" value={stats.students.toLocaleString()} icon={<UserCheck className="size-5" />} />
        <Stat label="O'qituvchilar" value={stats.teachers.toLocaleString()} icon={<Users className="size-5" />} />
        <Stat label="Administratorlar" value={stats.admins.toLocaleString()} icon={<Shield className="size-5" />} />
      </div>

      {/* Search + Filters */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        {/* Role tabs */}
        <div className="flex flex-wrap gap-1.5">
          {ROLE_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setRole(t.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                role === t.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.label}
              <span className="ml-1 opacity-70">
                {t.value === "all"
                  ? stats.total
                  : t.value === "STUDENT"
                    ? stats.students
                    : t.value === "TEACHER"
                      ? stats.teachers
                      : stats.admins}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Foydalanuvchilarni qidirish..."
              className="pl-9 h-10"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
            <SelectTrigger className="w-36 h-10"><SelectValue placeholder="Holat" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha holatlar</SelectItem>
              <SelectItem value="active">Faol</SelectItem>
              <SelectItem value="inactive">Nofaol</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="size-8" />}
          title="Foydalanuvchilar topilmadi"
          description="Qidiruv mezonlariga mos foydalanuvchi topilmadi."
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Foydalanuvchi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Rol</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground hidden sm:table-cell">Sahifalar</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground hidden md:table-cell">Vaqt</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground hidden lg:table-cell">Kitoblar</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Holat</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 group">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {u.name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-[200px] group-hover:text-primary transition-colors">{u.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qo'shilgan: {new Date(u.createdAt).toLocaleDateString("uz-UZ")}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={u.role === "ADMIN" ? "default" : "secondary"}
                        className={`text-[10px] ${
                          u.role === "ADMIN"
                            ? "bg-primary/10 text-primary"
                            : u.role === "TEACHER"
                              ? "bg-blue-500/10 text-blue-600"
                              : ""
                        }`}
                      >
                        {u.role === "TEACHER" ? "O'qituvchi" : u.role === "ADMIN" ? "Admin" : "O'quvchi"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden sm:table-cell">
                      {u.totalPages.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden md:table-cell">
                      {Math.round(u.readingTime / 60)} soat
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden lg:table-cell">
                      {u.bookCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={u.isActive ? "secondary" : "destructive"}
                        className={`text-[10px] ${
                          u.isActive ? "bg-green-500/10 text-green-600" : ""
                        }`}
                      >
                        {u.isActive ? "Faol" : "Nofaol"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {u.id !== currentUserId && u.role !== "ADMIN" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={busy === u.id}
                              onClick={() => toggleRole(u.id, u.role)}
                            >
                              {busy === u.id ? <Loader2 className="size-3 animate-spin" /> : null}
                              {u.role === "TEACHER" ? "O'quvchi qilish" : "O'qituvchi qilish"}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              disabled={busy === u.id}
                              onClick={() => toggleActive(u.id, u.isActive)}
                            >
                              {u.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                            </Button>
                          </>
                        )}
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
