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
  X,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useLanguage } from "@/lib/i18n/language-provider";
import { toast } from "sonner";
import type { Book } from "@/types";

function getCsrfCookie(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)mbsi_csrf=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : "";
}

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

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  allLabel,
  items,
}: {
  value: string;
  onValueChange: (v: string | null) => void;
  placeholder: string;
  allLabel: string;
  items: { id: string; name: string }[];
}) {
  const selectedName = value === "all" || !value
    ? allLabel
    : items.find((i) => i.id === value)?.name ?? placeholder;

  return (
    <Select value={value || "all"} onValueChange={onValueChange}>
      <SelectTrigger className="h-9 w-auto px-3 text-xs">
        <span className="truncate max-w-[120px]">{selectedName}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {items.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function BooksBrowser({ categories, authors, initial }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const isAdmin = user?.role === "ADMIN";

  const [q, setQ] = useState(initial.q);
  const [debouncedQ, setDebouncedQ] = useState(initial.q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  const [language, setLanguage] = useState(initial.language);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [authorId, setAuthorId] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Book[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

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
    if (debouncedQ) params.set("q", debouncedQ);
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
  }, [debouncedQ, language, categoryId, authorId, sort, page, refreshKey]);

  function titleCaseAuthor(v: string) {
    return v.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
  }

  function resetPage(setter: (v: string) => void) {
    return (v: string | null) => {
      setter(v ?? "");
      setPage(1);
    };
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(t.booksBrowser.errorTitle);
      return;
    }
    if (!form.file) {
      toast.error(t.booksBrowser.errorFile);
      return;
    }
    if (!form.categoryId && !showNewCategory) {
      toast.error(t.booksBrowser.errorCategory);
      return;
    }
    if (!form.author.trim()) {
      toast.error(t.booksBrowser.errorAuthor);
      return;
    }
    if (/[^\p{L}\s.'-]/u.test(form.author.trim())) {
      toast.error(t.booksBrowser.errorAuthorChars);
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
      fd.append("isPublished", String(form.isPublished));
      fd.append("file", form.file);
      if (showNewCategory && newCategory.trim()) {
        fd.append("newCategory", newCategory.trim());
      } else {
        fd.append("categoryId", form.categoryId);
      }
      if (form.cover && form.cover.size > 0) fd.append("cover", form.cover);

      const r = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
        headers: { "x-csrf-token": getCsrfCookie() },
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err?.error?.message || t.booksBrowser.errorUpload);
      }
      toast.success(t.booksBrowser.successAdd);
      setForm(EMPTY_FORM);
      setNewCategory("");
      setShowNewCategory(false);
      setAddOpen(false);
      setPage(1);
      setSort("newest");
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      toast.error(e.message || t.booksBrowser.errorAdd);
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

  const LANG_OPTIONS = [
    { id: "all", name: t.booksBrowser.allLanguages },
    { id: "UZ", name: "O'zbek" },
    { id: "RU", name: "Rus" },
    { id: "EN", name: "English" },
  ];

  const SORT_OPTIONS = [
    { id: "newest", name: t.booksBrowser.sortByNew },
    { id: "rating", name: t.booksBrowser.sortByRating },
    { id: "popular", name: t.booksBrowser.sortByPopular },
    { id: "pages", name: t.booksBrowser.sortByPages },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.booksBrowser.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t.booksBrowser.subtitle}
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
              {t.booksBrowser.addBook}
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-lg">
                  {t.booksBrowser.addBookTitle}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={submitAdd} className="grid gap-4 py-2">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label>
                    {t.booksBrowser.titleLabel} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder={t.booksBrowser.titlePlaceholder}
                  />
                </div>

                {/* Author */}
                <div className="space-y-1.5">
                  <Label>
                    {t.booksBrowser.authorLabel} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.author}
                    onChange={(e) =>
                      setForm({ ...form, author: titleCaseAuthor(e.target.value) })
                    }
                    placeholder={t.booksBrowser.authorPlaceholder}
                    autoCapitalize="words"
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label>
                    {t.booksBrowser.categoryLabel} <span className="text-destructive">*</span>
                  </Label>
                  {!showNewCategory ? (
                    <div className="flex gap-2">
                      <FilterSelect
                        value={form.categoryId}
                        onValueChange={(v) => setForm({ ...form, categoryId: v ?? "" })}
                        placeholder={t.booksBrowser.categoryPlaceholder}
                        allLabel={t.booksBrowser.allCategories}
                        items={categories}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewCategory(true)}
                        className="shrink-0"
                      >
                        {t.booksBrowser.newCategory}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder={t.booksBrowser.newCategoryPlaceholder}
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
                        {t.booksBrowser.cancel}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Language + Pages */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t.booksBrowser.languageLabel}</Label>
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
                    <Label>{t.booksBrowser.pagesLabel}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.totalPages}
                      onChange={(e) =>
                        setForm({ ...form, totalPages: e.target.value })
                      }
                      placeholder={t.booksBrowser.pagesPlaceholder}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label>{t.booksBrowser.descriptionLabel}</Label>
                  <Textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder={t.booksBrowser.descriptionPlaceholder}
                  />
                </div>

                {/* PDF file */}
                <div className="space-y-1.5">
                  <Label>
                    {t.booksBrowser.pdfLabel} <span className="text-destructive">*</span>
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
                          {t.booksBrowser.pdfDragDrop}
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
                    {t.booksBrowser.pdfMaxSize}
                  </p>
                </div>

                {/* Cover image */}
                <div className="space-y-1.5">
                  <Label>{t.booksBrowser.coverLabel}</Label>
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
                          {t.booksBrowser.coverPlaceholder}
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
                        aria-label={t.booksBrowser.removeCover}
                      >
                        <X size={14} />
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
                  {t.booksBrowser.publishNow}
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
                    {saving ? t.booksBrowser.submitting : t.booksBrowser.submit}
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
          placeholder={t.booksBrowser.searchPlaceholder}
          className="h-12 pl-11 text-sm border-transparent bg-muted/50 focus:border-primary/20 focus:bg-card"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          value={language}
          onValueChange={resetPage(setLanguage)}
          placeholder={t.booksBrowser.languageLabel}
          allLabel={t.booksBrowser.allLanguages}
          items={LANG_OPTIONS}
        />
        <FilterSelect
          value={categoryId}
          onValueChange={resetPage(setCategoryId)}
          placeholder={t.booksBrowser.categoryPlaceholder}
          allLabel={t.booksBrowser.allCategories}
          items={categories}
        />
        <FilterSelect
          value={authorId}
          onValueChange={resetPage(setAuthorId)}
          placeholder={t.booksBrowser.authorLabel}
          allLabel={t.booksBrowser.allAuthors}
          items={authors}
        />
        <FilterSelect
          value={sort}
          onValueChange={resetPage(setSort)}
          placeholder={t.booksBrowser.sortByNew}
          allLabel={t.booksBrowser.sortByNew}
          items={SORT_OPTIONS}
        />
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
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
          title={t.booksBrowser.emptyTitle}
          description={t.booksBrowser.emptyDescription}
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {t.booksBrowser.resultsCount(data.length)}
          </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
            <ChevronLeft size={14} /> {t.booksBrowser.prev}
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
            {t.booksBrowser.next} <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
