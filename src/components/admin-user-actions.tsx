"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeyRound, UserRoundX, UserRoundCheck, CornerDownLeft } from "lucide-react";

export function AdminUserActions({
  userId,
  name,
  username,
  isActive,
  canDelete,
}: {
  userId: string;
  name: string;
  username?: string | null;
  isActive: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  async function resetPassword() {
    setBusy("reset");
    try {
      const res = await api.post<{ password: string }>(
        `/api/admin/users/${userId}/reset-password`
      );
      setNewPassword(res.password);
      toast.success("Parol yangilandi");
    } catch (e: any) {
      toast.error(e.message ?? "Xatolik");
    } finally {
      setBusy(null);
    }
  }

  async function toggleActive() {
    setBusy("active");
    try {
      await api.patch(`/api/admin/users/${userId}`, { isActive: !isActive });
      toast.success(isActive ? "Foydalanuvchi bloklandi" : "Foydalanuvchi faollashtirildi");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Xatolik");
    } finally {
      setBusy(null);
    }
  }

  async function removeUser() {
    setBusy("delete");
    try {
      await api.del(`/api/admin/users/${userId}`);
      toast.success("Foydalanuvchi o'chirildi");
      router.push("/admin/users");
    } catch (e: any) {
      toast.error(e.message ?? "Xatolik");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {!isActive ? (
          <Button size="sm" onClick={toggleActive} disabled={busy === "active"}>
            <UserRoundCheck size={15} /> Faollashtirish
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={toggleActive}
            disabled={busy === "active"}
          >
            <UserRoundX size={15} /> Bloklash
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => setResetOpen(true)} disabled={busy === "reset"}>
          <KeyRound size={15} /> Parolni tiklash
        </Button>
        {canDelete && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={busy === "delete"}
          >
            <UserRoundX size={15} /> O&apos;chirish
          </Button>
        )}
      </div>

      <Dialog open={resetOpen} onOpenChange={(o) => !o && setResetOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Parolni tiklash</DialogTitle>
            <DialogDescription>
              <strong>{name}</strong> (@{username ?? "—"}) uchun yangi parol yaratiladi. Eski parol
              bekor qilinadi.
            </DialogDescription>
          </DialogHeader>
          {newPassword ? (
            <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
              <p className="text-xs text-muted-foreground">Yangi parol</p>
              <p className="select-all font-mono text-lg font-bold tracking-wider">{newPassword}</p>
              <p className="text-[11px] text-muted-foreground">
                Bu parol endi ko&apos;rinmaydi — uni saqlab qoling.
              </p>
            </div>
          ) : (
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={resetPassword} disabled={busy === "reset"}>
                <KeyRound size={15} /> Yangi parol yaratish
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Foydalanuvchini o&apos;chirish</DialogTitle>
            <DialogDescription>
              <strong>{name}</strong> butun tizimdan o&apos;chiriladi. Bu amalni qaytarib
              bo&apos;lmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={removeUser} disabled={busy === "delete"}>
              <CornerDownLeft size={15} /> O&apos;chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}