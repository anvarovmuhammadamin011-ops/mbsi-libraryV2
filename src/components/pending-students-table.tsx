"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Eye, Check, X, UserPlus, Loader2, CheckCircle2, Copy } from "lucide-react";
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
  login: string;
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
  const [approved, setApproved] = useState<{
    name: string;
    login: string;
    password: string | null;
  } | null>(null);

  async function decide(id: string, action: "approve" | "reject") {
    const msg =
      action === "approve"
        ? "O'quvchini tasdiqlaysizmi? U bazaga qo'shiladi."
        : "Arizani rad etasizmi?";
    if (!confirm(msg)) return;
    setBusyId(id);
    try {
      const res = await api.patch<{
        action: string;
        approved: boolean;
        userId: string | null;
      }>(`/api/admin/students/pending/${id}`, { action });
      if (action === "approve" && viewing) {
        // Yangi o'quvchi parolini guard'dan o'tgan credentials API orqali
        // olamiz (faqat ADMIN/REGISTRAR ko'ra oladi).
        let password: string | null = null;
        if (res?.userId) {
          try {
            const credsRes = await fetch(
              `/api/admin/students/credentials?ids=${res.userId}`
            );
            const credsBody = await credsRes.json();
            if (credsBody?.success && credsBody.data?.[0]) {
              password = credsBody.data[0].password ?? null;
            }
          } catch {
            /* parolni olib bo'lmasa — dialogda "ruxsat yo'q" ko'rinadi */
          }
        }
        setApproved({
          name: `${viewing.firstName} ${viewing.lastName}`.trim(),
          login: viewing.login,
          password,
        });
      } else {
        toast.success("Ariza rad etildi");
      }
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
          <thead className="border-b border-border bg-muted/30">              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Ism Familya
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Login
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
                <td className="px-4 py-3">
                  <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium">
                    {p.login}
                  </code>
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
                    ["Login", viewing.login],
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
                     ["Qo'shimcha", viewing.about ?? "—"],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium break-words">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                🔐 Tasdiqlangach o&apos;quvchi <strong>{viewing.login}</strong>{" "}
                logini bilan ilovaga kira oladi (parol ariza yuborilganda
                belgilangan).
              </p>
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

      {/* Tasdiqlash muvaffaqiyatli — login ma'lumotlari */}
      <Dialog open={approved !== null} onOpenChange={(o) => !o && setApproved(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-600" />
              O'quvchi qo'shildi
            </DialogTitle>
          </DialogHeader>
          {approved && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{approved.name}</strong>{" "}
                tizimga qo'shildi. Endi o'quvchi quyidagi ma'lumotlar bilan
                ilovaga kira oladi:
              </p>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Login</p>
                      <code className="text-base font-bold">{approved.login}</code>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        navigator.clipboard.writeText(approved.login).catch(() => {});
                        toast.success("Login nusxalandi");
                      }}
                    >
                      <Copy size={14} /> Nusxalash
                    </Button>
                  </div>
                  {approved.password ? (
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Parol</p>
                        <code className="text-base font-bold">{approved.password}</code>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          navigator.clipboard
                            .writeText(approved.password ?? "")
                            .catch(() => {});
                          toast.success("Parol nusxalandi");
                        }}
                      >
                        <Copy size={14} /> Nusxalash
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Parolni ko'rish uchun ruxsat yo'q yoki parol saqlanmagan.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
