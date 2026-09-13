"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  UserPlus,
  Eye,
  UserRoundX,
  UserRoundCheck,
  Trash2,
  ShieldCheck,
  Shield,
  GraduationCap,
  Star,
  Briefcase,
  CircleUserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

export type ManagedUser = {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  username?: string;
  email?: string;
  phone?: string;
  group?: string;
  gender?: string;
  staffPosition?: string;
  teacherSubject?: string;
  studentId?: string;
  staffId?: string;
  lastLoginAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalPages: number;
    readingTime: number;
    completedBooks: number;
    activeBooks: number;
  };
};

type TabKey = "all" | "student" | "teacher" | "staff";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Barcha" },
  { key: "student", label: "O'quvchilar" },
  { key: "teacher", label: "O'qituvchilar" },
  { key: "staff", label: "Boshqa xodimlar" },
];

const USER_TYPES = [
  { value: "all", label: "Barcha turlar" },
  { value: "Student", label: "O'quvchi" },
  { value: "Teacher", label: "O'qituvchi" },
  { value: "Direktor", label: "Direktor" },
  { value: "Admin", label: "Administrator" },
  { value: "Staff", label: "Xodim" },
];

function userTypeOf(u: ManagedUser): string {
  switch (u.role) {
    case "STUDENT":
      return "Student";
    case "TEACHER":
      return "Teacher";
    case "ADMIN":
      return "Admin";
    case "BOOK_MANAGER":
    case "REGISTRAR":
      return "Staff";
    case "STAFF":
      return u.staffPosition === "Direktor" ? "Direktor" : "Staff";
    default:
      return "Staff";
  }
}

function roleLabel(u: ManagedUser): string {
  switch (u.role) {
    case "STUDENT":
      return "O'quvchi";
    case "TEACHER":
      return "O'qituvchi";
    case "ADMIN":
      return "Administrator";
    case "BOOK_MANAGER":
      return "Kitob menejeri";
    case "REGISTRAR":
      return "Registrator";
    case "STAFF":
      return u.staffPosition ?? "Xodim";
    default:
      return u.role;
  }
}

function schoolId(u: ManagedUser): string {
  return (
    u.studentId ??
    u.staffId ??
    (u.group ? `Guruh: ${u.group}` : u.teacherSubject ? `Fan: ${u.teacherSubject}` : u.staffPosition ?? "—")
  );
}

function roleIcon(u: ManagedUser) {
  switch (u.role) {
    case "STUDENT":
      return <GraduationCap size={15} className="text-blue-600" />;
    case "TEACHER":
      return <Star size={15} className="text-violet-600" />;
    default:
      return <Briefcase size={15} className="text-muted-foreground" />;
  }
}

export function AdminUsersView() {
  const router = useRouter();
  const [rows, setRows] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all"); // all | active | blocked
  const [type, setType] = useState("all");
  const [tab, setTab] = useState<TabKey>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<ManagedUser[]>("/api/admin/users");
      setRows(data);
    } catch (e: any) {
      toast.error(e.message ?? "Ro'yxat olinmadi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((u) => {
      if (tab === "student" && u.role !== "STUDENT") return false;
      if (tab === "teacher" && u.role !== "TEACHER") return false;
      if (tab === "staff") {
        if (!["ADMIN", "BOOK_MANAGER", "REGISTRAR", "STAFF"].includes(u.role)) return false;
      }
      if (type !== "all" && userTypeOf(u) !== type) return false;
      if (status === "active" && !u.isActive) return false;
      if (status === "blocked" && u.isActive) return false;
      if (!q) return true;
      return [u.name, u.username, u.email, u.phone, u.group, u.staffPosition, u.teacherSubject]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, tab, type, status, query]);

  async function toggleBlock(u: ManagedUser) {
    const next = !u.isActive;
    setBusyId(u.id);
    try {
      await api.patch(`/api/admin/users/${u.id}`, { isActive: next });
      toast.success(next ? "Foydalanuvchi faollashtirildi" : "Foydalanuvchi bloklandi");
      setRows((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: next } : x)));
    } catch (e: any) {
      toast.error(e.message ?? "Xatolik");
    } finally {
      setBusyId(null);
    }
  }

  async function removeUser() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await api.del(`/api/admin/users/${deleteTarget.id}`);
      toast.success("Foydalanuvchi o'chirildi");
      setRows((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message ?? "Xatolik");
    } finally {
      setBusyId(null);
    }
  }

  const fmtDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleString("uz-UZ", { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab((v ?? "all") as TabKey)}>
          <TabsList className="h-9">
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 w-56 pl-9"
              placeholder="Qidirish..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={type} onValueChange={(v) => setType(v ?? "all")}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Tur" />
            </SelectTrigger>
            <SelectContent>
              {USER_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Holat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="active">Faol</SelectItem>
              <SelectItem value="blocked">Bloklangan</SelectItem>
            </SelectContent>
          </Select>
          <Link
            href="/admin/users/add"
            className={buttonVariants({ size: "default" })}
          >
            <UserPlus size={16} /> Yangi foydalanuvchi
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-14 text-center">
          <CircleUserRound size={40} className="text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Foydalanuvchilar topilmadi</p>
        </Card>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-base font-bold text-primary">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                  ) : (
                    u.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold">{u.name}</p>
                    {u.role === "ADMIN" && <ShieldCheck size={14} className="shrink-0 text-amber-600" />}
                    {u.role === "BOOK_MANAGER" && <Shield size={14} className="shrink-0 text-sky-600" />}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    {roleIcon(u)}
                    <span>
                      {roleLabel(u)}
                      {u.username ? ` · @${u.username}` : ""}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {u.studentId || u.staffId
                      ? `ID: ${u.studentId ?? u.staffId}`
                      : schoolId(u) !== "—"
                        ? schoolId(u)
                        : u.phone ?? "—"}
                  </p>
                </div>
                <Badge variant={u.isActive ? "success" : "destructive"} className="shrink-0">
                  {u.isActive ? "Faol" : "Bloklangan"}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-muted/50 p-2 text-center">
                <MiniStat label="O'qishlar" value={String(u.stats.activeBooks)} />
                <MiniStat label="Sahifa" value={u.stats.totalPages.toLocaleString()} />
                <MiniStat label="Kitob" value={String(u.stats.completedBooks)} />
                <MiniStat label="Vaqt, daq" value={String(u.stats.readingTime)} />
              </div>

              <p className="mt-2 text-[11px] text-muted-foreground">
                Oxirgi login: <span className="tabular-nums">{fmtDate(u.lastLoginAt)}</span>
              </p>

              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/admin/users/${u.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}
                >
                  <Eye size={14} /> Ko&apos;rish
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === u.id}
                  onClick={() => toggleBlock(u)}
                  title={u.isActive ? "Bloklash" : "Faollashtirish"}
                >
                  {u.isActive ? <UserRoundX size={14} /> : <UserRoundCheck size={14} />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteTarget(u)}
                  disabled={busyId === u.id}
                  title="O'chirish"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Foydalanuvchini o&apos;chirish</DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.name}</strong> (@{deleteTarget?.username ?? "—"}) butun tizimdan
              o&apos;chiriladi. Bu amalni qaytarib bo&apos;lmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={removeUser}
              disabled={busyId === deleteTarget?.id}
            >
              <Trash2 size={15} /> O&apos;chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-bold tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}