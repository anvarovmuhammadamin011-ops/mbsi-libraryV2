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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Eye,
  Users,
  Ban,
  CheckCircle2,
  Pencil,
  Loader2,
} from "lucide-react";

export interface StudentRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  group: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
  parentContact: string | null;
  healthNote: string | null;
  about: string | null;
  isActive: boolean;
  bookCount: number;
  lastActiveAt: string | null;
  createdAt: string;
}

const PAGE_SIZE = 10;

export function AdminStudentsTable({
  students,
  groups,
  currentUserId,
}: {
  students: StudentRow[];
  groups: string[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<StudentRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return students.filter((s) => {
      if (group !== "all" && (s.group ?? "") !== group) return false;
      if (status === "active" && !s.isActive) return false;
      if (status === "inactive" && s.isActive) return false;
      if (status === "new") {
        const created = new Date(s.createdAt).getTime();
        return Date.now() - created < 7 * 86400000; // oxirgi 7 kun ichida qo'shilgan
      }
      if (
        needle &&
        !`${s.name} ${s.email ?? ""} ${s.group ?? ""}`
          .toLowerCase()
          .includes(needle)
      )
        return false;
      return true;
    });
  }, [students, q, group, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function toggleBlock(s: StudentRow) {
    setBusyId(s.id);
    try {
      await api.patch(`/api/admin/users/${s.id}`, { isActive: !s.isActive });
      toast.success(s.isActive ? "O'quvchi bloklandi" : "O'quvchi faollashtirildi");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Xatolik");
    } finally {
      setBusyId(null);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    if (editing.name.trim().length < 2) {
      toast.error("Ism kamida 2 harf bo'lsin");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/api/admin/users/${editing.id}`, {
        name: editing.name.trim(),
        email: editing.email ?? "",
        phone: editing.phone ?? "",
        group: editing.group ?? "",
        age: editing.age,
        address: editing.address ?? "",
        parentContact: editing.parentContact ?? "",
      });
      toast.success("Ma'lumotlar saqlandi");
      setEditing(null);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Xatolik");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Ism, email yoki guruh..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={group}
            onValueChange={(v) => {
              setGroup(v ?? "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Guruh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha guruh</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v ?? "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="active">Faol</SelectItem>
              <SelectItem value="inactive">Faol emas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {paged.length === 0 ? (
        <EmptyState
          icon={<Users className="size-8" />}
          title="O'quvchilar topilmadi"
          description="Filtrlarni o'zgartirib ko'ring."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                    O&apos;quvchi
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                    Guruh
                  </th>
                  <th className="hidden px-4 py-3 text-right text-xs font-semibold text-muted-foreground lg:table-cell">
                    Yosh
                  </th>
                  <th className="hidden px-4 py-3 text-right text-xs font-semibold text-muted-foreground sm:table-cell">
                    Kitoblar
                  </th>
                  <th className="hidden px-4 py-3 text-right text-xs font-semibold text-muted-foreground lg:table-cell">
                    Oxirgi faollik
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                    Faollik
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/students/${s.id}`}
                        className="max-w-[200px] truncate font-medium hover:text-primary hover:underline"
                      >
                        {s.name}
                      </Link>
                      <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {s.email ?? s.phone ?? "—"}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-xs">{s.group ?? "—"}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-right text-xs text-muted-foreground lg:table-cell">
                      {s.age ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-xs text-muted-foreground sm:table-cell">
                      {s.bookCount}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-xs text-muted-foreground lg:table-cell">
                      {s.lastActiveAt
                        ? new Date(s.lastActiveAt).toLocaleDateString("uz-UZ")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={s.isActive ? "default" : "secondary"}
                        className={`text-[10px] ${s.isActive ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}
                      >
                        {s.isActive ? "Faol" : "Faol emas"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewing(s)}
                          aria-label="Ko'rish"
                        >
                          <Eye size={14} className="text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditing(s)}
                          aria-label="Tahrirlash"
                        >
                          <Pencil size={14} className="text-muted-foreground" />
                        </Button>
                        {s.id !== currentUserId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={busyId === s.id}
                            onClick={() => toggleBlock(s)}
                            aria-label={s.isActive ? "Bloklash" : "Faollashtirish"}
                          >
                            {s.isActive ? (
                              <Ban size={14} className="text-muted-foreground" />
                            ) : (
                              <CheckCircle2 size={14} className="text-green-600" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filtered.length)} / {filtered.length}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Oldingi
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Keyingi
            </Button>
          </div>
        </div>
      )}

      {/* View dialog */}
      <Dialog open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>O&apos;quvchi profili</DialogTitle>
          </DialogHeader>
          {viewing && (
            <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-2 text-sm">
              {(
                [
                  ["Ism", viewing.name],
                  ["Email", viewing.email ?? "—"],
                  ["Telefon", viewing.phone ?? "—"],
                  ["Guruh", viewing.group ?? "—"],
                  ["Yosh", viewing.age?.toString() ?? "—"],
                  [
                    "Jins",
                    viewing.gender === "MALE"
                      ? "Erkak"
                      : viewing.gender === "FEMALE"
                        ? "Ayol"
                        : "—",
                  ],
                  ["Manzil", viewing.address ?? "—"],
                  ["Ota-ona", viewing.parentContact ?? "—"],
                  ["Salomatlik", viewing.healthNote ?? "—"],
                  ["Qo'shimcha", viewing.about ?? "—"],
                  ["Kitoblar", viewing.bookCount.toString()],
                  [
                    "Ro'yxatdan",
                    new Date(viewing.createdAt).toLocaleDateString("uz-UZ"),
                  ],
                  ["Status", viewing.isActive ? "Faol" : "Bloklangan"],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium break-words">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tahrirlash</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label>Ism Familya</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    value={editing.email ?? ""}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefon</Label>
                  <Input
                    value={editing.phone ?? ""}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Guruh</Label>
                  <Input
                    value={editing.group ?? ""}
                    onChange={(e) => setEditing({ ...editing, group: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Yosh</Label>
                  <Input
                    type="number"
                    value={editing.age ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        age: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Manzil</Label>
                <Input
                  value={editing.address ?? ""}
                  onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ota-ona kontakti</Label>
                <Input
                  value={editing.parentContact ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, parentContact: e.target.value })
                  }
                />
              </div>
              <Button onClick={saveEdit} disabled={saving} className="gap-2">
                {saving && <Loader2 className="size-4 animate-spin" />}
                Saqlash
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
