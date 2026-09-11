"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Eye, Check, X, UserPlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface PendingRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  group: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
  parentContact: string | null;
  healthNote: string | null;
  about: string | null;
  createdAt: string;
}

export function PendingStudentsTable({ items }: { items: PendingRow[] }) {
  const router = useRouter();
  const [viewing, setViewing] = useState<PendingRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function decide(id: string, action: "approve" | "reject") {
    const msg =
      action === "approve"
        ? "O'quvchini tasdiqlaysizmi? U bazaga qo'shiladi."
        : "Arizani rad etasizmi?";
    if (!confirm(msg)) return;
    setBusyId(id);
    try {
      await api.patch(`/api/admin/students/pending/${id}`, { action });
      toast.success(
        action === "approve" ? "✅ O'quvchi qo'shildi" : "Ariza rad etildi"
      );
      setViewing(null);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Xatolik");
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<UserPlus className="size-8" />}
        title="Kutilayotgan ariza yo'q"
        description="Yangi o'quvchi arizalari shu yerda ko'rinadi."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Ism Familya
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground sm:table-cell">
                Email
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                Guruh
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground lg:table-cell">
                Vaqti
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                Amallar
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <p className="font-medium">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground sm:hidden">
                    {p.email ?? "—"}
                  </p>
                </td>
                <td className="hidden max-w-[180px] truncate px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                  {p.email ?? "—"}
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <Badge variant="secondary" className="text-[11px]">
                    {p.group ?? "—"}
                  </Badge>
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                  {new Date(p.createdAt).toLocaleString("uz-UZ")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewing(p)}
                      aria-label="Ko'rish"
                    >
                      <Eye size={14} className="text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600 hover:text-green-600"
                      disabled={busyId === p.id}
                      onClick={() => decide(p.id, "approve")}
                      aria-label="Tasdiqlash"
                    >
                      {busyId === p.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={15} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      disabled={busyId === p.id}
                      onClick={() => decide(p.id, "reject")}
                      aria-label="Rad etish"
                    >
                      <X size={15} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ariza tafsilotlari</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-2 text-sm">
                {(
                  [
                    ["Ism", `${viewing.firstName} ${viewing.lastName}`],
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
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium break-words">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-1.5"
                  disabled={busyId === viewing.id}
                  onClick={() => decide(viewing.id, "approve")}
                >
                  <Check size={15} /> Tasdiqlash
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5"
                  disabled={busyId === viewing.id}
                  onClick={() => decide(viewing.id, "reject")}
                >
                  <X size={15} /> Rad etish
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
