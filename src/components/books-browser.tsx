"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { BookCardView } from "@/components/book-card-view";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, BookX } from "lucide-react";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kitoblar</h1>
        <p className="text-sm text-muted-foreground">Kutubxonadagi barcha kitoblar</p>
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => resetPage(setQ)(e.target.value)}
            placeholder="Qidirish…"
            className="pl-9"
          />
        </div>
        <Select value={language || "all"} onValueChange={resetPage(setLanguage)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Til" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha tillar</SelectItem>
            <SelectItem value="UZ">O'zbek</SelectItem>
            <SelectItem value="RU">Rus</SelectItem>
            <SelectItem value="EN">English</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryId || "all"} onValueChange={resetPage(setCategoryId)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Kategoriya" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha kategoriyalar</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={authorId || "all"} onValueChange={resetPage(setAuthorId)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Muallif" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha mualliflar</SelectItem>
            {authors.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={resetPage(setSort)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Saralash" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Yangi</SelectItem>
            <SelectItem value="rating">Reyting</SelectItem>
            <SelectItem value="popular">Mashhur</SelectItem>
            <SelectItem value="pages">Sahifalar</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={<BookX className="size-8" />}
          title="Kitoblar topilmadi"
          description="Boshqa filtrlarni sinab ko'ring."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {data.map((b) => (
            <BookCardView key={b.id} book={b} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Oldingi
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Keyingi
          </Button>
        </div>
      )}
    </div>
  );
}
