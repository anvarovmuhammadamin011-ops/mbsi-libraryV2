"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X, ArrowLeft, Star, BookOpen, BookX } from "lucide-react";
import type { Book } from "@/types";

const STORAGE_KEY = "mbsi-recent-searches";
type Filter = "all" | "books" | "authors" | "categories";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Hammasi" },
  { value: "books", label: "Kitoblar" },
  { value: "authors", label: "Mualliflar" },
  { value: "categories", label: "Kategoriyalar" },
];

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [filter, setFilter] = useState<Filter>("all");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);
  const [defaultBooks, setDefaultBooks] = useState<Book[]>([]);
  const [defaultLoading, setDefaultLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(!!initialQ);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // load recents from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecents(parsed);
        }
      }
    } catch {}
  }, []);

  const persistRecents = useCallback((next: string[]) => {
    setRecents(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const addRecent = useCallback(
    (term: string) => {
      const t = term.trim();
      if (!t) return;
      setRecents((prev) => {
        const filtered = prev.filter((r) => r.toLowerCase() !== t.toLowerCase());
        const next = [t, ...filtered].slice(0, 10);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const removeRecent = (term: string) => {
    const next = recents.filter((r) => r !== term);
    persistRecents(next);
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    setHasSearched(true);
    inputRef.current?.focus();
  };

  // Load default books when no query
  useEffect(() => {
    const q = query.trim();
    if (q) {
      setDefaultBooks([]);
      return;
    }
    setDefaultLoading(true);
    fetch("/api/books?pageSize=20&sort=newest")
      .then((r) => r.json())
      .then((json: any) => setDefaultBooks(json.data ?? []))
      .catch(() => setDefaultBooks([]))
      .finally(() => setDefaultLoading(false));
  }, [query]);

  // live fetch with debounce
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setBooks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      params.set("q", q);
      params.set("pageSize", "50");
      fetch(`/api/search?${params.toString()}`)
        .then((r) => r.json())
        .then((json: { data?: Book[] }) => {
          setBooks(json.data ?? []);
        })
        .catch(() => setBooks([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelectResult(book: Book) {
    if (query.trim()) addRecent(query.trim());
  }

  function handleSearch() {
    const q = query.trim();
    if (q) {
      setHasSearched(true);
      addRecent(q);
    }
  }

  const qLower = query.trim().toLowerCase();
  const filteredBooks = books.filter((b) => {
    if (!qLower) return true;
    const titleMatch = b.title.toLowerCase().includes(qLower);
    const authorMatch = (b.author?.name ?? "").toLowerCase().includes(qLower);
    const categoryMatch = (b.category?.name ?? "").toLowerCase().includes(qLower);
    if (filter === "books") return titleMatch;
    if (filter === "authors") return authorMatch;
    if (filter === "categories") return categoryMatch;
    return true;
  });

  const showRecents = !hasSearched && query.trim() === "";
  const showResults = hasSearched || query.trim() !== "";
  const showDefault = !hasSearched && query.trim() === "";

  return (
    <div className="mx-auto max-w-2xl md:max-w-3xl lg:max-w-4xl animate-fade-in pb-6">
      {/* Sticky Search Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md pb-3 pt-1">
        {/* Back + Title */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => router.back()}
            aria-label="Orqaga"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Qidiruv</h1>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setFilter("all");
              if (e.target.value.trim()) {
                setHasSearched(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
              if (e.key === "Escape") {
                setQuery("");
                setHasSearched(false);
              }
            }}
            placeholder="Kitob, muallif qidiring..."
            aria-label="Kitob, muallif qidirish"
            className="h-12 w-full rounded-2xl border border-border bg-white dark:bg-card pl-11 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
            autoFocus
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setHasSearched(false);
              }}
              aria-label="Tozalash"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter chips */}
        {showResults && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {FILTERS.map((f) => {
              const active = filter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  aria-label={`${f.label} bo'yicha saralash`}
                  aria-pressed={active}
                  className={
                    active
                      ? "shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors"
                      : "shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  }
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent searches */}
      {showRecents && (
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Oxirgi qidiruvlar</h2>
          {recents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hali qidiruvlar yo'q</p>
          ) : (
            <ul className="space-y-1">
              {recents.slice(0, 6).map((term) => (
                <li
                  key={term}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/60 transition-colors group"
                >
                  <button
                    onClick={() => handleRecentClick(term)}
                    className="flex-1 text-left text-sm text-foreground truncate pr-3"
                  >
                    {term}
                  </button>
                  <button
                    onClick={() => removeRecent(term)}
                    aria-label={`${term} ni o'chirish`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Default books when no query */}
      {showDefault && (
        <div className="mt-4">
          <h2 className="text-base font-semibold text-foreground mb-3">📚 Barcha kitoblar</h2>
          {defaultLoading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-[3/4] w-full rounded-xl bg-muted animate-pulse" />
                  <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          ) : defaultBooks.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {defaultBooks.map((book) => {
                const avg = book.averageRating ? Number(book.averageRating).toFixed(1) : null;
                return (
                  <Link
                    key={book.id}
                    href={`/books/${book.slug ?? book.id}`}
                    className="group"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-muted">
                      {book.coverUrl ? (
                        <Image
                          src={book.coverUrl}
                          alt={book.title}
                          fill
                          className="object-cover group-hover:scale-[1.02] transition-transform"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <BookOpen size={28} className="text-primary/30" />
                        </div>
                      )}
                    </div>
                    <div className="pt-2">
                      <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
                        {book.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {book.author?.name ?? "Noma'lum"}
                      </p>
                      {avg && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star size={12} className="fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">{avg}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Kitoblar hali mavjud emas</p>
          )}
        </div>
      )}

      {/* Search Results */}
      {showResults && (
        <div className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-2xl border border-border bg-card p-3 animate-pulse"
                >
                  <div className="h-[68px] w-12 shrink-0 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                    <div className="h-3 w-16 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-5 rounded-2xl bg-muted/70 p-5 text-muted-foreground">
                <BookX className="size-8" />
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-foreground">Hech narsa topilmadi</h3>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Boshqa so'z bilan qidiring yoki filtni o'zgartiring.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                {filteredBooks.length} ta kitob topildi
              </p>
              <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0">
                {filteredBooks.map((book) => (
                  <Link
                    key={book.id}
                    href={`/books/${book.slug ?? book.id}`}
                    onClick={() => handleSelectResult(book)}
                    className="flex gap-3 rounded-2xl border border-border bg-card p-3 hover:shadow-sm hover:bg-muted/30 transition-colors"
                  >
                    <div className="relative h-[68px] md:h-[80px] w-12 md:w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {book.coverUrl ? (
                        <Image
                          src={book.coverUrl}
                          alt={book.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <BookOpen size={18} className="text-primary/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-center min-w-0 py-0.5">
                      <h3 className="text-sm font-semibold leading-tight text-foreground line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {book.author?.name ?? "Noma'lum muallif"}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium text-foreground">
                          {book.averageRating ? Number(book.averageRating).toFixed(1) : "—"}
                        </span>
                        {book.category?.name && (
                          <>
                            <span className="text-[11px] text-muted-foreground mx-1">·</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {book.category.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl p-4 text-sm text-muted-foreground">Yuklanmoqda...</div>}>
      <SearchPageInner />
    </Suspense>
  );
}
