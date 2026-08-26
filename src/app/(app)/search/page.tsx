"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X, ArrowLeft, Star, BookOpen, BookX } from "lucide-react";
import type { Book } from "@/types";

const STORAGE_KEY = "mbsi-recent-searches";
const DEFAULT_RECENTS = ["Atomic Habits", "Python", "History"];
type Filter = "all" | "books" | "authors" | "categories";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "books", label: "Books" },
  { value: "authors", label: "Authors" },
  { value: "categories", label: "Categories" },
];

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [filter, setFilter] = useState<Filter>("all");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [recents, setRecents] = useState<string[]>(DEFAULT_RECENTS);

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
    } catch {
      // ignore
    }
  }, []);

  const persistRecents = useCallback((next: string[]) => {
    setRecents(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
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
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  const removeRecent = (term: string) => {
    const next = recents.filter((r) => r !== term);
    // if user removes all, keep empty array (don't re-add defaults)
    persistRecents(next);
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

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

  // optionally add to recents after user stops typing (debounced)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => {
      // only add if there are results or query is meaningful
      // we add optimistically to improve UX
      // avoid adding on every keystroke by checking if already in recents
      if (!recents.some((r) => r.toLowerCase() === q.toLowerCase())) {
        // don't auto-add too aggressively; only if user appears to have finished typing
        // we do a lightweight add - uncomment if you want auto-add on search
        // addRecent(q);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [query, recents]);

  function handleSelectResult(book: Book) {
    if (query.trim()) addRecent(query.trim());
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
    return true; // all - show all server results
  });

  const showRecents = query.trim() === "";
  const showResults = query.trim() !== "";

  return (
    <div className="mx-auto max-w-2xl md:max-w-3xl lg:max-w-4xl animate-fade-in pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Search</h1>
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
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              addRecent(query.trim());
            }
            if (e.key === "Escape") {
              setQuery("");
            }
          }}
          placeholder="Search books, authors..."
          className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/20 transition-colors"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter chips - only when query exists */}
      {showResults && (
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
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

      {/* Recent searches - only when query empty */}
      {showRecents && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Recent searches</h2>
          {recents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent searches</p>
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
                    aria-label={`Remove ${term}`}
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

      {/* Results */}
      {showResults && (
        <div className="mt-5">
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
              <h3 className="mb-1.5 text-base font-semibold text-foreground">No books found</h3>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Try another keyword or check the filter.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                {filteredBooks.length} book{filteredBooks.length !== 1 ? "s" : ""} found
              </p>
            <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0">
              {filteredBooks.map((book) => (
                <Link
                    key={book.id}
                    href={`/books/${book.slug ?? book.id}`}
                    onClick={() => handleSelectResult(book)}
                    className="flex gap-3 rounded-2xl border border-border bg-card p-3 hover:shadow-sm hover:bg-muted/30 transition-colors"
                  >
                    {/* cover */}
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
                        {book.author?.name ?? "Unknown author"}
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
    <Suspense fallback={<div className="mx-auto max-w-2xl p-4 text-sm text-muted-foreground">Loading...</div>}>
      <SearchPageInner />
    </Suspense>
  );
}
