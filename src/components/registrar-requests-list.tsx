"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, FileText, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export interface RegistrarRequestRow {
  id: string;
  firstName: string;
  lastName: string;
  group: string | null;
  age: number | null;
  status: string;
  createdAt: string;
  phone: string | null;
  email: string | null;
  about: string | null;
}

const STATUS_META: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Tasdiqlash kutilmoqda",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    icon: <Clock size={12} />,
  },
  APPROVED: {
    label: "Tasdiqlangan",
    className: "bg-green-500/10 text-green-600 border-green-500/30",
    icon: <CheckCircle2 size={12} />,
  },
  REJECTED: {
    label: "Rad etilgan",
    className: "bg-red-500/10 text-red-500 border-red-500/30",
    icon: <XCircle size={12} />,
  },
};

export function RegistrarRequestsList({ items }: { items: RegistrarRequestRow[] }) {
  const [viewing, setViewing] = useState<RegistrarRequestRow | null>(null);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="size-8" />}
        title="Hozircha arizalar yo'q"
        description="Yangi o'quvchi qo'shish formasi orqali yuborgan arizalaringiz shu yerda ko'rinadi."
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  O&apos;quvchi
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground sm:table-cell">
                  Guruh
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                  Yuborilgan
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((r) => {
                const meta = STATUS_META[r.status] ?? STATUS_META.PENDING;
                return (
                  <tr key={r.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {r.firstName} {r.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {r.group ?? "—"}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <Badge variant="secondary" className="text-[11px]">
                        {r.group ?? "—"}
                      </Badge>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-muted-foreground md:table-cell">
                      {new Date(r.createdAt).toLocaleString("uz-UZ")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="outline"
                        className={`gap-1 text-[10px] ${meta.className}`}
                      >
                        {meta.icon}
                        {meta.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewing(r)}
                        aria-label="Ko'rish"
                      >
                        <Eye size={14} className="text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
                    ["Guruh", viewing.group ?? "—"],
                    ["Yosh", viewing.age?.toString() ?? "—"],
                    ["Telefon", viewing.phone ?? "—"],
                    ["Email", viewing.email ?? "—"],
                    [
                      "Yuborilgan",
                      new Date(viewing.createdAt).toLocaleString("uz-UZ"),
                    ],
                    ["Qo'shimcha", viewing.about ?? "—"],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium break-words">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="flex items-center gap-2 text-sm">
                  {(STATUS_META[viewing.status] ?? STATUS_META.PENDING).icon}
                  <span className="font-medium">
                    {(STATUS_META[viewing.status] ?? STATUS_META.PENDING).label}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {viewing.status === "PENDING"
                    ? "Admin tasdiqlashi kutilmoqda — Telegram orqali ham xabar beriladi."
                    : viewing.status === "APPROVED"
                      ? "O'quvchi tizimga qo'shildi va kutubxonadan foydalana oladi."
                      : "Bu ariza rad etilgan."}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
