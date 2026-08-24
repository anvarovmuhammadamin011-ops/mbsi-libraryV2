"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

type Banner = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  link?: string | null;
  order?: number | null;
  isActive?: boolean | null;
};

export default function AdminBannersPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    link: "",
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Banner[]>("/api/admin/banners");
      setItems(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      imageUrl: "",
      link: "",
      order: items.length + 1,
      isActive: true,
    });
    setOpen(true);
  }

  function openEdit(b: Banner) {
    setEditing(b);
    setForm({
      title: b.title,
      description: b.description ?? "",
      imageUrl: b.imageUrl ?? "",
      link: b.link ?? "",
      order: b.order ?? 0,
      isActive: b.isActive ?? true,
    });
    setOpen(true);
  }

  async function save() {
    try {
      if (editing) {
        await api.patch(`/api/admin/banners/${editing.id}`, form);
        toast.success("Banner yangilandi");
      } else {
        await api.post("/api/admin/banners", form);
        toast.success("Banner qo'shildi");
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function remove(b: Banner) {
    if (!confirm(`"${b.title}" bannerini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await api.del(`/api/admin/banners/${b.id}`);
      toast.success("Banner o'chirildi");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bannerlar</h1>
          <p className="mt-1 text-muted-foreground">{items.length} ta banner</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus size={16} /> Banner qo&apos;shish
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Yuklanmoqda…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{b.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.description || "—"}
                  </p>
                  {b.link && (
                    <p className="mt-1 truncate text-xs text-primary">{b.link}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {b.isActive ? "Faol" : "Nofaol"} · tartib {b.order ?? 0}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" className="h-8 w-8" />
                    }
                  >
                    <MoreHorizontal size={14} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2" onClick={() => openEdit(b)}>
                      <Edit size={14} /> Tahrirlash
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-destructive"
                      onClick={() => remove(b)}
                    >
                      <Trash2 size={14} /> O&apos;chirish
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Banneri tahrirlash" : "Yangi banner"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="title">Sarlavha</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="desc">Tavsif</Label>
              <Textarea
                id="desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="img">Rasm (URL)</Label>
                <Input
                  id="img"
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm({ ...form, imageUrl: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="link">Havola</Label>
                <Input
                  id="link"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="order">Tartib</Label>
                <Input
                  id="order"
                  type="number"
                  value={form.order}
                  onChange={(e) =>
                    setForm({ ...form, order: Number(e.target.value) })
                  }
                />
              </div>
              <label className="flex items-center gap-2 self-end pb-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                <span className="text-sm">Faol</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Bekor</Button>} />
            <Button onClick={save}>{editing ? "Saqlash" : "Qo'shish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
