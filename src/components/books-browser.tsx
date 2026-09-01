"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { BookCardView } from "@/components/book-card-view";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  BookX,
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  Loader2,
  FileText,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import type { Book } from "@/types";

interface Category {
  id: string;
  name: string;
}
interface Author {
  id: string;
  name: string;
}
interface Props {
  categories: Category[];
  authors: Author[];
  initial: { q: string; categoryId: string; language: string };
}

interface BookForm {
  title: string;
  author: string;
  categoryId: string;
  language: string;
  totalPages: string;
  coinReward: string;
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
  coinReward: "10",
  description: "",
  isPublished: true,
  file: null,
  cover: null,
};

export function BooksBrowser({ categories, authors, initial }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [q, setQ] = useState(initial.q);
  const [language, setLanguage] = useState(initial.language);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [authorId, setAuthorId] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Book[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Add book dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<BookForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (language && language !== "all") params.set("language", language);
    if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);
    if (authorId && authorId !== "all") params.set("authorId", authorId);
    if (sort) params.set("sort", sort);
    params.set("page", String(page));
    fetch(`/api/books?${params.toString()}`)
      .then((r) => r.json())
      .then((json: any) => {
        if (cancelled) return;
        setData(json.data ?? []);
        setTotalPages(json.pagination?.totalPages ?? 1);
      })
      .catch(() => !cancelled && setData([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [q, language, categoryId, authorId, sort, page, refreshKey]);

  function resetPage(setter: (v: string) => void) {
    return (v: string | null) => {
      setter(v ?? "");
      setPage(1);
    };
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Sarlavha to'ldirilishi shart");
      return;
    }
    if (!form.file) {
      toast.error("PDF fayl tanlash shart");
      return;
    }
    if (!form.categoryId && !showNewCategory) {
      toast.error("Kategoriya tanlang yoki yangi nom yozing");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("author", form.author.trim() || "Noma'lum");
      fd.append("description", form.description.trim());
      fd.append("language", form.language);
      fd.append("totalPages", form.totalPages || "1");
      fd.append("coinReward", form.coinReward || "10");
      fd.append("isPublished", String(form.isPublished));
      fd.append("file", form.file);
      if (showNewCategory && newCategory.trim()) {
        fd.append("newCategory", newCategory.trim());
      } else {
        fd.append("categoryId", form.categoryId);
      }
      if (form.cover && form.cover.size > 0) fd.append("cover", form.cover);

      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err?.error?.message || "Yuklashda xatolik");
      }
      toast.success("Kitob muvaffaqiyatli qo'shildi!");
      setForm(EMPTY_FORM);
      setNewCategory("");
      setShowNewCategory(false);
      setAddOpen(false);
      // Refresh the book list
      setPage(1);
      setSort("newest");
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      toast.error(e.message || "Kitobni qo'shishda xatolik");
    } finally {
      setSaving(false);
    }
  }

  function openAddDialog() {
    setForm(EMPTY_FORM);
    setNewCategory("");
    setShowNewCategory(false);
    setAddOpen(true);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kitoblar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kutubxonadagi barcha kitoblar
          </p>
        </div>
        {isAdmin && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger
              render={
                <Button
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                />
              }
            >
              <Plus size={16} />
              Kitob qo&apos;shish
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-lg">
                  Yangi kitob qo&apos;shish
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={submitAdd} className="grid gap-4 py-2">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label>
                    Sarlavha <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="Kitob nomi"
                  />
                </div>

                {/* Author */}
                <div className="space-y-1.5">
                  <Label>Muallif</Label>
                  <Input
                    value={form.author}
                    onChange={(e) =>
                      setForm({ ...form, author: e.target.value })
                    }
                    placeholder="Muallif ismi (yangi bo'lsa yaratiladi)"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label>
                    Kategoriya <span className="text-destructive">*</span>
                  </Label>
                  {!showNewCategory ? (
                    <div className="flex gap-2">
                      <Select
                        value={form.categoryId || undefined}
                        onValueChange={(v) =>
                          setForm({ ...form, categoryId: v ?? "" })
                        }
                      >
                        <SelectTrigger className="flex-1 h-9">
                          <SelectValue placeholder="Kategoriya tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewCategory(true)}
                        className="shrink-0"
                      >
                        Yangi
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Yangi kategoriya nomi"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowNewCategory(false);
                          setNewCategory("");
                        }}
                        className="shrink-0"
                      >
                        Bekor
                      </Button>
                    </div>
                  )}
                </div>

                {/* Language + Pages */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Til</Label>
                    <select
                      value={form.language}
                      onChange={(e) =>
                        setForm({ ...form, language: e.target.value })
                      }
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
                      onChange={(e) =>
                        setForm({ ...form, totalPages: e.target.value })
                      }
                      placeholder="avtomatik"
                    />
                  </div>
                </div>

                {/* Coin reward */}
                <div className="space-y-1.5">
                  <Label>Coin mukofoti</Label>
                  <Input
                    type="number"
                    min={0}
                    max={1000}
                    value={form.coinReward}
                    onChange={(e) =>
                      setForm({ ...form, coinReward: e.target.value })
                    }
                    placeholder="masalan: 10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Kitob tugatganda beriladigan coin miqdori
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label>Tavsif</Label>
                  <Textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Kitob haqida qisqacha..."
                  />
                </div>

                {/* PDF file */}
                <div className="space-y-1.5">
                  <Label>
                    PDF fayl <span className="text-destructive">*</span>
                  </Label>
                  <div
                    className="flex items-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-4 transition-colors hover:border-primary/40 hover:bg-muted/50 cursor-pointer"
                    onClick={() => fileRef.current?.click()}
                  >
                    <FileText
                      size={24}
                      className="text-muted-foreground shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      {form.file ? (
                        <div>
                          <p className="text-sm font-medium truncate">
                            {form.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(form.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          PDF faylni tanlang yoki sudrab tashlang
                        </p>
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        file: e.target.files?.[0] ?? null,
                      })
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Maksimal 25 MB
                  </p>
                </div>

                {/* Cover image */}
                <div className="space-y-1.5">
                  <Label>Muqova rasm (ixtiyoriy)</Label>
                  <div
                    className="flex items-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-3 transition-colors hover:border-primary/40 hover:bg-muted/50 cursor-pointer"
                    onClick={() => coverRef.current?.click()}
                  >
                    {form.cover ? (
                      <img
                        src={URL.createObjectURL(form.cover)}
                        alt="Muqova"
                        className="h-16 w-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Upload
                          size={16}
                          className="text-muted-foreground"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {form.cover ? (
                        <p className="text-sm font-medium truncate">
                          {form.cover.name}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Muqova rasm tanlang (ixtiyoriy)
                        </p>
                      )}
                    </div>
                    {form.cover && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm({ ...form, cover: null });
                          if (coverRef.current) coverRef.current.value = "";
                        }}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                  <input
                    ref={coverRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        cover: e.target.files?.[0] ?? null,
                      })
                    }
                  />
                </div>

                {/* Publish toggle */}
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) =>
                      setForm({ ...form, isPublished: e.target.checked })
                    }
                    className="accent-primary"
                  />
                  Darhol nashr etish
                </label>

                {/* Submit */}
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="gap-2 w-full sm:w-auto"
                  >
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Upload className="size-4" />
                    )}
                    {saving ? "Yuklanmoqda..." : "Kitobni qo'shish"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => resetPage(setQ)(e.target.value)}
          placeholder="Kitob, muallif yoki mavzu qidiring…"
          className="h-12 pl-11 text-sm border-transparent bg-muted/50 focus:border-primary/20 focus:bg-card"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={language || "all"}
          onValueChange={resetPage(setLanguage)}
        >
          <SelectTrigger className="h-9 w-auto px-3 text-xs">
            <SelectValue placeholder="Til" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha tillar</SelectItem>
            <SelectItem value="UZ">O&apos;zbek</SelectItem>
            <SelectItem value="RU">Rus</SelectItem>
            <SelectItem value="EN">English</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={categoryId || "all"}
          onValueChange={resetPage(setCategoryId)}
        >
          <SelectTrigger className="h-9 w-auto px-3 text-xs">
            <SelectValue placeholder="Kategoriya" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha kategoriyalar</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={authorId || "all"}
          onValueChange={resetPage(setAuthorId)}
        >
          <SelectTrigger className="h-9 w-auto px-3 text-xs">
            <SelectValue placeholder="Muallif" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha mualliflar</SelectItem>
            {authors.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={resetPage(setSort)}>
          <SelectTrigger className="h-9 w-auto px-3 text-xs">
            <SelectValue placeholder="Saralash" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Yangi</SelectItem>
            <SelectItem value="rating">Reyting</SelectItem>
            <SelectItem value="popular">Mashhur</SelectItem>
            <SelectItem value="pages">Sahifalar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
              <Skeleton className="h-3 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={<BookX className="size-8" />}
          title="Kitoblar topilmadi"
          description="Boshqa filtrlarni sinab ko'ring."
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {data.length} ta kitob topildi
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {data.map((b) => (
              <BookCardView key={b.id} book={b} />
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="gap-1"
          >
            <ChevronLeft size={14} /> Oldingi
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="gap-1"
          >
            Keyingi <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
