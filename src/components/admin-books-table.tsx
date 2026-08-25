"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Plus,
  Trash2,
  Eye,
  BookMarked,
  Upload,
  Pencil,
  Loader2,
} from "lucide-react";

interface BookRow {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  categoryName: string;
  description: string;
  language: string;
  totalPages: number;
  isPublished: boolean;
  readerCount: number;
  ratingCount: number;
  averageRating: number | null;
  createdAt: string;
  coverUrl: string;
}

interface Props {
  books: BookRow[];
  categories: { id: string; name: string }[];
}

interface BookForm {
  title: string;
  author: string;
  categoryId: string;
  language: string;
  totalPages: string;
  description: string;
  isPublished: boolean;
  file: File | null;
  cover: File | null;
}

const EMPTY_FORM: BookForm = {
  title: "",
  author: "",
  categoryId: "",
  language: "UZ",
  totalPages: "",
  description: "",
  isPublished: true,
  file: null,
  cover: null,
};

export function AdminBooksTable({ books, categories }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [language, setLanguage] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<BookForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<BookRow | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Filter & sort
  const filtered = useMemo(() => {
    let result = [...books];
    if (q) {
      const lower = q.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(lower) ||
          b.authorName.toLowerCase().includes(lower)
      );
    }
    if (language !== "all") result = result.filter((b) => b.language === language);
    if (category !== "all") result = result.filter((b) => b.categoryName === category);
    if (status === "published") result = result.filter((b) => b.isPublished);
    if (status === "draft") result = result.filter((b) => !b.isPublished);
    if (sort === "newest") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === "oldest") result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (sort === "popular") result.sort((a, b) => b.readerCount - a.readerCount);
    if (sort === "rating") result.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
    return result;
  }, [books, q, language, category, status, sort]);

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim() || !form.file) {
      toast.error("Sarlavha, muallif va PDF fayl to'ldirilishi shart");
      return;
    }
    if (!form.categoryId) {
      toast.error("Kategoriya tanlang");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("author", form.author.trim());
      fd.append("description", form.description.trim());
      fd.append("language", form.language);
      fd.append("totalPages", form.totalPages || "1");
      fd.append("isPublished", String(form.isPublished));
      fd.append("categoryId", form.categoryId);
      fd.append("file", form.file);
      if (form.cover && form.cover.size > 0) fd.append("cover", form.cover);

      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err?.error?.message || err?.error || "Yuklashda xatolik");
      }
      toast.success("Kitob qo'shildi");
      setForm(EMPTY_FORM);
      setAddOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Yuklashda xatolik");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editing.title.trim()) {
      toast.error("Sarlavha bo'sh bo'lmasligi kerak");
      return;
    }
    setEditSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", editing.title.trim());
      fd.append("author", editing.authorName);
      fd.append("description", editing.description ?? "");
      fd.append("language", editing.language);
      fd.append("totalPages", String(editing.totalPages));
      await api.patch(`/api/admin/books/${editing.id}`, fd);
      toast.success("Yangilandi");
      setEditing(null);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Saqlashda xatolik");
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteBook(id: string) {
    if (!confirm("Bu kitobni o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.")) return;
    setDeleting(id);
    try {
      await api.delete(`/api/admin/books/${id}`);
      toast.success("Kitob o'chirildi");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Kitobni o'chirishda xatolik");
    } finally {
      setDeleting(null);
    }
  }

  async function togglePublish(id: string, current: boolean) {
    try {
      await api.patch(`/api/admin/books/${id}`, { isPublished: !current });
      toast.success(current ? "Kitob nashrdan olindi" : "Kitob nashr etildi");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Yangilashda xatolik");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kitoblar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            MBSI kutubxonasi kitoblarini boshqarish · Jami {books.length}
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button className="gap-2" />}>
            <Plus size={16} /> Kitob qo&apos;shish
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
            <DialogHeader>
              <DialogTitle>Yangi kitob qo&apos;shish</DialogTitle>
            </DialogHeader>
            <form onSubmit={submitAdd} className="grid gap-3">
              <div className="space-y-1.5">
                <Label>Sarlavha *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Kitob nomi"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Muallif *</Label>
                <Input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="Muallif ismi (yangi bo'lsa yaratiladi)"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kategoriya *</Label>
                <Select
                  value={form.categoryId || undefined}
                  onValueChange={(v) => setForm({ ...form, categoryId: v ?? "" })}
                >
                  <SelectTrigger className="w-full h-9"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Til</Label>
                  <select
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    <option value="UZ">O&apos;zbek</option>
                    <option value="RU">Rus</option>
                    <option value="EN">Ingliz</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Sahifalar soni</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.totalPages}
                    onChange={(e) => setForm({ ...form, totalPages: e.target.value })}
                    placeholder="avtomatik aniqlanadi"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tavsif</Label>
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Kitob haqida qisqacha..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>PDF fayl *</Label>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
                />
                <p className="text-[11px] text-muted-foreground">Maksimal 25 MB</p>
              </div>
              <div className="space-y-1.5">
                <Label>Muqova rasmi</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm({ ...form, cover: e.target.files?.[0] ?? null })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="accent-primary"
                />
                Darhol nashr etish
              </label>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                Yuklash
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Filters */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Kitoblarni qidirish..."
              className="pl-9 h-10"
            />
          </div>
          <Select value={language} onValueChange={(v) => setLanguage(v ?? "all")}>
            <SelectTrigger className="w-32 h-10"><SelectValue placeholder="Til" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha tillar</SelectItem>
              <SelectItem value="UZ">O&apos;zbek</SelectItem>
              <SelectItem value="RU">Rus</SelectItem>
              <SelectItem value="EN">Ingliz</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(v) => setCategory(v ?? "all")}>
            <SelectTrigger className="w-40 h-10"><SelectValue placeholder="Kategoriya" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha kategoriyalar</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
            <SelectTrigger className="w-32 h-10"><SelectValue placeholder="Holat" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha holatlar</SelectItem>
              <SelectItem value="published">Nashr etilgan</SelectItem>
              <SelectItem value="draft">Qoralama</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v ?? "newest")}>
            <SelectTrigger className="w-36 h-10"><SelectValue placeholder="Saralash" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Eng yangi</SelectItem>
              <SelectItem value="oldest">Eng eski</SelectItem>
              <SelectItem value="popular">Eng ko&apos;p o&apos;qilgan</SelectItem>
              <SelectItem value="rating">Eng yuqori reytingli</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookMarked className="size-8" />}
          title="Kitoblar topilmadi"
          description="Boshqa qidiruv so'zlari yoki filtrlarni sinab ko'ring."
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Kitob</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">Kategoriya</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden lg:table-cell">Til</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Sahifalar</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground hidden sm:table-cell">O&apos;quvchilar</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground hidden md:table-cell">Reyting</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Holat</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {b.coverUrl ? (
                            <Image src={b.coverUrl} alt={b.title} fill className="object-cover" sizes="32px" unoptimized />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <BookMarked size={12} className="text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-[200px]">{b.title}</p>
                          <p className="text-xs text-muted-foreground">{b.authorName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{b.categoryName}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Badge variant="secondary" className="text-[10px]">{b.language}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">{b.totalPages}</td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden sm:table-cell">{b.readerCount}</td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden md:table-cell">
                      {b.averageRating ? b.averageRating.toFixed(1) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={b.isPublished ? "default" : "secondary"}
                        className={`text-[10px] ${b.isPublished ? "bg-green-500/10 text-green-600" : ""}`}
                      >
                        {b.isPublished ? "Nashr etilgan" : "Qoralama"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditing(b)}
                        >
                          <Pencil size={14} className="text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => togglePublish(b.id, b.isPublished)}
                        >
                          {b.isPublished ? (
                            <Eye size={14} className="text-muted-foreground" />
                          ) : (
                            <Upload size={14} className="text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteBook(b.id)}
                          disabled={deleting === b.id}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kitobni tahrirlash</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label>Sarlavha</Label>
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Muallif</Label>
                <Input
                  value={editing.authorName}
                  onChange={(e) => setEditing({ ...editing, authorName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Til</Label>
                  <select
                    value={editing.language}
                    onChange={(e) => setEditing({ ...editing, language: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    <option value="UZ">O&apos;zbek</option>
                    <option value="RU">Rus</option>
                    <option value="EN">Ingliz</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Sahifalar</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editing.totalPages}
                    onChange={(e) => setEditing({ ...editing, totalPages: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tavsif</Label>
                <Textarea
                  rows={3}
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <Button onClick={saveEdit} disabled={editSaving} className="gap-2">
                {editSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                Saqlash
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
