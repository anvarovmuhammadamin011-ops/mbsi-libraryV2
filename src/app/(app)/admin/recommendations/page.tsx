"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Book } from "@/types";

type Recommendation = {
  id: string;
  title: string;
  description?: string | null;
  bookId: string;
  order?: number | null;
  isActive?: boolean | null;
};

export default function AdminRecommendationsPage() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Recommendation | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    bookId: "",
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [recs, bks] = await Promise.all([
        api.get<Recommendation[]>("/api/admin/recommendations"),
        api.get<Book[]>("/api/books?pageSize=50"),
      ]);
      setItems(recs);
      setBooks(bks);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  const bookTitle = (id: string) =>
    books.find((b) => b.id === id)?.title ?? id;

  function openCreate() {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      bookId: books[0]?.id ?? "",
      order: items.length + 1,
      isActive: true,
    });
    setOpen(true);
  }

  function openEdit(r: Recommendation) {
    setEditing(r);
    setForm({
      title: r.title,
      description: r.description ?? "",
      bookId: r.bookId,
      order: r.order ?? 0,
      isActive: r.isActive ?? true,
    });
    setOpen(true);
  }

  async function save() {
    try {
      if (editing) {
        await api.patch(`/api/admin/recommendations/${editing.id}`, form);
        toast.success("Tavsiya yangilandi");
      } else {
        await api.post("/api/admin/recommendations", form);
        toast.success("Tavsiya qo'shildi");
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function remove(r: Recommendation) {
    if (!confirm(`"${r.title}" tavsiyasini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await api.del(`/api/admin/recommendations/${r.id}`);
      toast.success("Tavsiya o'chirildi");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tavsiyalar</h1>
          <p className="mt-1 text-muted-foreground">{items.length} ta tavsiya</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus size={16} /> Tavsiya qo&apos;shish
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Yuklanmoqda…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.description || "—"}
                  </p>
                  <p className="mt-1 truncate text-xs text-primary">
                    {bookTitle(r.bookId)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.isActive ? "Faol" : "Nofaol"} · tartib {r.order ?? 0}
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
                    <DropdownMenuItem className="gap-2" onClick={() => openEdit(r)}>
                      <Edit size={14} /> Tahrirlash
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-destructive"
                      onClick={() => remove(r)}
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
              {editing ? "Tavsiyani tahrirlash" : "Yangi tavsiya"}
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
            <div className="space-y-1">
              <Label>Kitob</Label>
              <Select
                value={form.bookId}
                onValueChange={(v) => setForm({ ...form, bookId: v ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kitob tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {books.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
