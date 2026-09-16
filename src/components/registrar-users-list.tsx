"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, GraduationCap, Star, Briefcase, CircleUserRound } from "lucide-react";
import type { UserRole } from "@/types";

type ManagedUser = {
  id: string;
  name: string;
  role: UserRole;
  username?: string;
  group?: string;
  staffPosition?: string;
  teacherSubject?: string;
  studentId?: string;
  staffId?: string;
  phone?: string;
  lastLoginAt?: string;
  isActive: boolean;
};

type TabKey = "all" | "student" | "teacher" | "staff";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Barcha" },
  { key: "student", label: "O'quvchilar" },
  { key: "teacher", label: "O'qituvchilar" },
  { key: "staff", label: "Boshqa xodimlar" },
];

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

function schoolId(u: ManagedUser): string {
  return (
    u.studentId ??
    u.staffId ??
    (u.group ? `Guruh: ${u.group}` : u.teacherSubject ? `Fan: ${u.teacherSubject}` : u.staffPosition ?? "—")
  );
}

export function RegistrarUsersList() {
  const [rows, setRows] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabKey>("all");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get<ManagedUser[]>("/api/admin/users")
      .then((data) => {
        if (alive) setRows(data);
      })
      .catch((e: any) => {
        if (alive) toast.error(e.message ?? "Ro'yxat olinmadi");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((u) => {
      if (tab === "student" && u.role !== "STUDENT") return false;
      if (tab === "teacher" && u.role !== "TEACHER") return false;
      if (tab === "staff") {
        if (!["ADMIN", "BOOK_MANAGER", "REGISTRAR", "STAFF"].includes(u.role)) return false;
      }
      if (!q) return true;
      return [u.name, u.username, u.group, u.staffPosition, u.teacherSubject]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, tab, query]);

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
        <div className="relative">
          <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 w-56 pl-9 sm:w-64"
            placeholder="Qidirish..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
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
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{u.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    {roleIcon(u)}
                    <span>
                      {roleLabel(u)}
                      {u.username ? ` · @${u.username}` : ""}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {schoolId(u) === "—" ? (u.phone ?? "—") : schoolId(u)}
                  </p>
                </div>
                <Badge variant={u.isActive ? "success" : "destructive"} className="shrink-0">
                  {u.isActive ? "Faol" : "Bloklangan"}
                </Badge>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground border-t border-border/60 pt-2">
                Oxirgi login: <span className="tabular-nums">{fmtDate(u.lastLoginAt)}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}