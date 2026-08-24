"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Pencil, Trash2, Loader2 } from "lucide-react";

interface Props {
  books: {
    id: string;
    title: string;
    author: string;
    totalPages: number;
    categoryId: string | null;
    categoryName: string;
  }[];
  categories: { id: string; name: string }[];
}

export function AdminBooks({ books, categories }: Props) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    author: "",
    categoryId: "",
    totalPages: "",
    file: null as File | null,
  });
  const [editing, setEditing] = useState<null | (typeof books)[number]>(null);

  async function submitUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.file) {
      toast.error("Sarlavha va PDF fayl kerak");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("author", form.author);
    fd.append("categoryId", form.categoryId);
    fd.append("totalPages", form.totalPages || "1");
    fd.append("file", form.file);
    try {
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Yuklash xatosi");
      }
      toast.success("Kitob qo'shildi");
      setForm({ title: "", author: "", categoryId: "", totalPages: "", file: null });
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function deleteBook(id: string) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/api/admin/books/${id}`);
      toast.success("O'chirildi");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      const fd = new FormData();
      fd.append("title", editing.title);
      fd.append("categoryId", editing.categoryId ?? "");
      fd.append("totalPages", String(editing.totalPages));
      await api.patch(`/api/admin/books/${editing.id}`, fd);
      toast.success("Yangilandi");
      setEditing(null);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Kitoblar</h1>

      <Card className="p-4">
        <form onSubmit={submitUpload} className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Sarlavha</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Muallif</Label>
            <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Kategoriya</Label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
            >
              <option value="">- tanlanmagan -</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Sahifalar soni</Label>
            <Input type="number" value={form.totalPages} onChange={(e) => setForm({ ...form, totalPages: e.target.value })} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>PDF fayl</Label>
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
            />
          </div>
          <Button type="submit" disabled={uploading} className="gap-2 md:col-span-2">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Yuklash
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="p-3">Sarlavha</th>
              <th className="p-3">Muallif</th>
              <th className="p-3">Kategoriya</th>
              <th className="p-3">Sahifa</th>
              <th className="p-3 text-right">Amal</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{b.title}</td>
                <td className="p-3 text-muted-foreground">{b.author || "-"}</td>
                <td className="p-3 text-muted-foreground">{b.categoryName}</td>
                <td className="p-3 text-muted-foreground">{b.totalPages}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Dialog>
                      <DialogTrigger
                        render={<Button variant="outline" size="icon" onClick={() => setEditing(b)} />}
                      >
                        <Pencil className="size-4" />
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Kitobni tahrirlash</DialogTitle>
                        </DialogHeader>
                        {editing && (
                          <div className="grid gap-3">
                            <div className="space-y-1">
                              <Label>Sarlavha</Label>
                              <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <Label>Muallif</Label>
                              <Input value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <Label>Kategoriya</Label>
                              <select
                                value={editing.categoryId ?? ""}
                                onChange={(e) => setEditing({ ...editing, categoryId: e.target.value || null })}
                                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                              >
                                <option value="">- tanlanmagan -</option>
                                {categories.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label>Sahifa</Label>
                              <Input type="number" value={editing.totalPages} onChange={(e) => setEditing({ ...editing, totalPages: Number(e.target.value) })} />
                            </div>
                            <Button onClick={saveEdit}>Saqlash</Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="icon" onClick={() => deleteBook(b.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
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
