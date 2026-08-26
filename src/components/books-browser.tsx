"use client";

import { useEffect, useState } from "react";
import { BookCardView } from "@/components/book-card-view";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, BookX, ChevronLeft, ChevronRight } from "lucide-react";
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

export function BooksBrowser({ categories, authors, initial }: Props) {
  const [q, setQ] = useState(initial.q);
  const [language, setLanguage] = useState(initial.language);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [authorId, setAuthorId] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Book[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

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
  }, [q, language, categoryId, authorId, sort, page]);

  function resetPage(setter: (v: string) => void) {
    return (v: string | null) => {
      setter(v ?? "");
      setPage(1);
    };
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kitoblar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kutubxonadagi barcha kitoblar
        </p>
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
        <Select value={language || "all"} onValueChange={resetPage(setLanguage)}>
          <SelectTrigger className="h-9 w-auto px-3 text-xs"><SelectValue placeholder="Til" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha tillar</SelectItem>
            <SelectItem value="UZ">O'zbek</SelectItem>
            <SelectItem value="RU">Rus</SelectItem>
            <SelectItem value="EN">English</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryId || "all"} onValueChange={resetPage(setCategoryId)}>
          <SelectTrigger className="h-9 w-auto px-3 text-xs"><SelectValue placeholder="Kategoriya" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha kategoriyalar</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={authorId || "all"} onValueChange={resetPage(setAuthorId)}>
          <SelectTrigger className="h-9 w-auto px-3 text-xs"><SelectValue placeholder="Muallif" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha mualliflar</SelectItem>
            {authors.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={resetPage(setSort)}>
          <SelectTrigger className="h-9 w-auto px-3 text-xs"><SelectValue placeholder="Saralash" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Yangi</SelectItem>
            <SelectItem value="rating">Reyting</SelectItem>
            <SelectItem value="popular">Mashhur</SelectItem>
            <SelectItem value="pages">Sahifalar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {loading ? (          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
          <p className="text-sm text-muted-foreground">{data.length} ta kitob topildi</p>
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
