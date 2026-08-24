"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

type Author = {
  id: string;
  name: string;
  biography?: string | null;
  avatar?: string | null;
  bookCount: number;
};

export default function AdminAuthorsPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Author | null>(null);
  const [form, setForm] = useState({ name: "", biography: "", avatar: "" });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Author[]>("/api/admin/authors");
      setItems(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: "", biography: "", avatar: "" });
    setOpen(true);
  }

  function openEdit(a: Author) {
    setEditing(a);
    setForm({
      name: a.name,
      biography: a.biography ?? "",
      avatar: a.avatar ?? "",
    });
    setOpen(true);
  }

  async function save() {
    try {
      if (editing) {
        await api.patch(`/api/admin/authors/${editing.id}`, form);
        toast.success("Muallif yangilandi");
      } else {
        await api.post("/api/admin/authors", form);
        toast.success("Muallif qo'shildi");
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function remove(a: Author) {
    if (!confirm(`"${a.name}" muallifini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await api.del(`/api/admin/authors/${a.id}`);
      toast.success("Muallif o'chirildi");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const filtered = items.filter(
    (a) => !query || a.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mualliflar</h1>
          <p className="mt-1 text-muted-foreground">{items.length} ta muallif</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus size={16} /> Muallif qo&apos;shish
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Muallif qidirish…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Yuklanmoqda…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                    {a.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.bookCount} ta kitob
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
                    <DropdownMenuItem className="gap-2" onClick={() => openEdit(a)}>
                      <Edit size={14} /> Tahrirlash
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-destructive"
                      onClick={() => remove(a)}
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
              {editing ? "Muallifni tahrirlash" : "Yangi muallif"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name">Ism</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Muallif ismi"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bio">Biografiya</Label>
              <Textarea
                id="bio"
                value={form.biography}
                onChange={(e) =>
                  setForm({ ...form, biography: e.target.value })
                }
                placeholder="Qisqacha ma'lumot"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="avatar">Avatar (URL)</Label>
              <Input
                id="avatar"
                value={form.avatar}
                onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                placeholder="https://…"
              />
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
