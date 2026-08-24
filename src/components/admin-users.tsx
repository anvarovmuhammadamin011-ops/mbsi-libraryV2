"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Loader2 } from "lucide-react";

export function AdminUsers({
  users,
  currentUserId,
}: {
  users: { id: string; name: string; role: string; isActive: boolean }[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleRole(id: string, role: string) {
    setBusy(id);
    try {
      const next = role === "TEACHER" ? "STUDENT" : "TEACHER";
      await api.patch(`/api/admin/users/${id}`, { role: next });
      toast.success("Rol o'zgartirildi");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    setBusy(id);
    try {
      await api.patch(`/api/admin/users/${id}`, { isActive: !isActive });
      toast.success("Holat o'zgartirildi");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    setBusy(id);
    try {
      await api.delete(`/api/admin/users/${id}`);
      toast.success("O'chirildi");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Foydalanuvchilar</h1>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="p-3">Ism</th>
              <th className="p-3">Email</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Holat</th>
              <th className="p-3 text-right">Amal</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3">
                  <Badge variant={u.role === "TEACHER" ? "default" : "secondary"}>
                    {u.role === "TEACHER" ? "O'qituvchi" : "O'quvchi"}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge variant={u.isActive ? "secondary" : "destructive"}>
                    {u.isActive ? "Faol" : "Bloklangan"}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" disabled={busy === u.id} onClick={() => toggleRole(u.id, u.role)}>
                      {busy === u.id ? <Loader2 className="size-3 animate-spin" /> : null} Rol
                    </Button>
                    <Button variant="outline" size="sm" disabled={busy === u.id} onClick={() => toggleActive(u.id, u.isActive)}>
                      {u.isActive ? "Blok" : "Faollash"}
                    </Button>
                    {u.id !== currentUserId && (
                      <Button variant="outline" size="icon" disabled={busy === u.id} onClick={() => remove(u.id)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
