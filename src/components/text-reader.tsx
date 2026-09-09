"use client";

/**
 * TextReader — Page-by-page lazy loading text reader.
 *
 * - Loads only the current page's text from the server
 * - Pre-fetches next 2 pages in background
 * - Caches last 10 pages in memory, evicts older pages
 * - Page sidebar for quick navigation
 * - Configurable font size, line height, dark/light theme
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  Settings,
  BookOpen,
  List,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";

const FONT_SIZES = [
  { label: "Kichik", value: 16 },
  { label: "O'rtacha", value: 20 },
  { label: "Katta", value: 24 },
  { label: "Juda katta", value: 30 },
  { label: "Ulkan", value: 36 },
] as const;

const LINE_HEIGHTS = [
  { label: "Zich", value: 1.6 },
  { label: "Oddiy", value: 1.8 },
  { label: "Keng", value: 2.0 },
  { label: "Juda keng", value: 2.4 },
] as const;

const CACHE_MAX = 10; // Keep last 10 pages in memory
const PREFETCH_AHEAD = 2; // Pre-fetch next 2 pages

interface Props {
  bookId: string;
  title: string;
  totalPages: number;
  pdfUrl?: string;
}

interface PageData {
  text: string | null;
  loaded: boolean;
}

export function TextReader({ bookId, title, totalPages, pdfUrl }: Props) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  // ─── State ──────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTextPages, setTotalTextPages] = useState(0);
  const [pageCache, setPageCache] = useState<Map<number, string>>(new Map());
  const [loadingPage, setLoadingPage] = useState<number | null>(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [fontSizeIdx, setFontSizeIdx] = useState(1);
  const [lineHeightIdx, setLineHeightIdx] = useState(2);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  const fontSize = FONT_SIZES[fontSizeIdx].value;
  const lineHeight = LINE_HEIGHTS[lineHeightIdx].value;

  const sessionRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fetchAbortRef = useRef<Map<number, AbortController>>(new Map());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Fetch a single page ─────────────────────────────────
  const fetchPage = useCallback(
    async (page: number, signal?: AbortSignal): Promise<string | null> => {
      try {
        const res = await fetch(
          `/api/books/${bookId}/text-page?page=${page}`,
          { signal }
        );
        const data = await res.json();
        if (data.success) {
          if (data.data.totalPages > 0 && totalTextPages === 0) {
            setTotalTextPages(data.data.totalPages);
          }

          return data.data.text;
        }
        return null;
      } catch (err: any) {
        if (err.name === "AbortError") return null;
        return null;
      }
    },
    [bookId, totalTextPages]
  );

  // ─── Load current page + prefetch ────────────────────────
  const loadPage = useCallback(
    async (page: number) => {
      // Already cached?
      if (pageCache.has(page)) {
        setLoadingPage(null);
        return;
      }

      // Abort any in-flight fetch for this page
      const existing = fetchAbortRef.current.get(page);
      if (existing) existing.abort();

      const controller = new AbortController();
      fetchAbortRef.current.set(page, controller);

      setLoadingPage(page);
      const text = await fetchPage(page, controller.signal);

      if (text !== null) {
        setPageCache((prev) => {
          const next = new Map(prev);
          next.set(page, text);
          // Evict old pages from cache
          if (next.size > CACHE_MAX) {
            const keys = Array.from(next.keys()).sort((a, b) => {
              const distA = Math.abs(a - page);
              const distB = Math.abs(b - page);
              return distB - distA; // farthest pages first
            });
            while (next.size > CACHE_MAX) {
              const oldest = keys.pop();
              if (oldest !== undefined) next.delete(oldest);
            }
          }
          return next;
        });
        setStatus("ready");
      }

      setLoadingPage(null);
      fetchAbortRef.current.delete(page);
    },
    [fetchPage, pageCache]
  );

  // ─── Prefetch ahead pages ────────────────────────────────
  const prefetchAhead = useCallback(
    (page: number) => {
      for (let i = 1; i <= PREFETCH_AHEAD; i++) {
        const nextPage = page + i;
        if (nextPage > totalTextPages) break;
        if (!pageCache.has(nextPage) && loadingPage !== nextPage) {
          fetchPage(nextPage).then((text) => {
            if (text !== null) {
              setPageCache((prev) => {
                const next = new Map(prev);
                next.set(nextPage, text);
                return next;
              });
            }
          });
        }
      }
    },
    [fetchPage, pageCache, totalTextPages, loadingPage]
  );

  // ─── Navigate to page ────────────────────────────────────
  const gotoPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(page, totalTextPages || 1));
      if (clamped === currentPage) return;
      setCurrentPage(clamped);
      loadPage(clamped);
      prefetchAhead(clamped);
      // Scroll to top
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    },
    [currentPage, totalTextPages, loadPage, prefetchAhead]
  );

  // ─── Initial load ────────────────────────────────────────
  useEffect(() => {
    loadPage(1);
    prefetchAhead(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Reading session ─────────────────────────────────────
  useEffect(() => {
    if (sessionStarted) return;
    api
      .post<{ sessionId: string }>("/api/reading/session/start", {
        bookId,
        startPage: 1,
      })
      .then((r) => {
        sessionRef.current = r.sessionId;
        setSessionStarted(true);
      })
      .catch(() => {});
  }, [bookId, sessionStarted]);

  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        api
          .post("/api/reading/session/end", {
            sessionId: sessionRef.current,
            endPage: currentPage,
          })
          .catch(() => {});
      }
    };
  }, []);

  // ─── Save progress on page change ────────────────────────
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api
        .post("/api/reading/progress", { bookId, page: currentPage })
        .catch(() => {});
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [currentPage, bookId]);

  // ─── Keyboard navigation ─────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        gotoPage(currentPage - 1);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        gotoPage(currentPage + 1);
      } else if (e.key === "Escape") {
        setShowSidebar(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentPage, gotoPage]);

  // ─── Current page text ───────────────────────────────────
  const currentText = pageCache.get(currentPage);
  const isLoading = loadingPage === currentPage;
  const paragraphs = useMemo(
    () =>
      currentText
        ? currentText
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter(Boolean)
        : [],
    [currentText]
  );

  // ─── Colors ──────────────────────────────────────────────
  const bgClass = isDark ? "bg-[#0B1220]" : "bg-[#F9FAFB]";
  const headerBg = isDark ? "bg-[#0F172A]" : "bg-white";
  const headerBorder = isDark ? "border-slate-700/50" : "border-slate-200";
  const textClass = isDark ? "text-slate-200" : "text-slate-800";
  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";
  const sidebarBg = isDark ? "bg-[#0F172A]" : "bg-white";



  return (
    <div className={`fixed inset-0 z-50 flex flex-col overflow-hidden select-none ${bgClass}`}>
      {/* ═══ Top bar ═══ */}
      <header
        className={`flex items-center h-12 shrink-0 border-b ${headerBorder} ${headerBg} px-2 sm:px-3 z-20`}
        style={{ height: 48 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          className="h-8 w-8 shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>

        <div className="flex-1 min-w-0 flex justify-center px-2">
          <h1 className={`text-sm font-medium truncate max-w-[40vw] text-center ${textClass}`}>
            {title}
          </h1>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="h-8 w-8 shrink-0"
        >
          {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
          className={`h-8 w-8 shrink-0 ${showSettings ? "text-primary" : ""}`}
        >
          <Settings className="size-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSidebar(!showSidebar)}
          className={`h-8 w-8 shrink-0 ${showSidebar ? "text-primary" : ""}`}
        >
          <List className="size-5" />
        </Button>
      </header>

      {/* ═══ Settings panel ═══ */}
      {showSettings && (
        <div className={`shrink-0 border-b ${headerBorder} ${headerBg} px-4 py-3 space-y-3 z-10`}>
          <div>
            <p className={`text-xs font-medium ${mutedClass} mb-2`}>Shrift o'lchami</p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setFontSizeIdx((i) => Math.max(0, i - 1))}
                disabled={fontSizeIdx === 0}
              >
                <ZoomOut className="size-4" />
              </Button>
              <div className="flex-1 flex items-center justify-center">
                <span className="font-medium text-foreground" style={{ fontSize: Math.min(fontSize, 28) }}>
                  {fontSize}px — {FONT_SIZES[fontSizeIdx].label}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setFontSizeIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
                disabled={fontSizeIdx === FONT_SIZES.length - 1}
              >
                <ZoomIn className="size-4" />
              </Button>
            </div>
          </div>

          <div>
            <p className={`text-xs font-medium ${mutedClass} mb-2`}>Qator orasidagi masofa</p>
            <div className="flex gap-2">
              {LINE_HEIGHTS.map((lh, i) => (
                <Button
                  key={lh.value}
                  variant={i === lineHeightIdx ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setLineHeightIdx(i)}
                >
                  {lh.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Main content area ═══ */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Page sidebar */}
        {showSidebar && (
          <div
            className={`w-48 shrink-0 border-r ${headerBorder} ${sidebarBg} flex flex-col z-10`}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className={`text-xs font-medium ${mutedClass}`}>Sahifalar</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowSidebar(false)}>
                <X className="size-3" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {Array.from({ length: totalTextPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    gotoPage(p);
                    setShowSidebar(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    p === currentPage
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  Sahifa {p}
                  {pageCache.has(p) && p !== currentPage && (
                    <span className={`ml-1 ${mutedClass}`}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <article
            className={`max-w-2xl mx-auto px-6 py-8 ${textClass}`}
            style={{ fontSize: `${fontSize}px`, lineHeight }}
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="size-6 animate-spin text-primary mb-3" />
                <p className={`text-sm ${mutedClass}`}>Sahifa yuklanmoqda...</p>
              </div>
            ) : paragraphs.length > 0 ? (
              <>
                {/* Page header */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className={`h-px flex-1 max-w-16 ${isDark ? "bg-slate-700" : "bg-slate-300"}`} />
                  <span className={`text-xs ${mutedClass}`} style={{ fontSize: `${Math.max(11, fontSize * 0.55)}px` }}>
                    — Sahifa {currentPage} —
                  </span>
                  <div className={`h-px flex-1 max-w-16 ${isDark ? "bg-slate-700" : "bg-slate-300"}`} />
                </div>

                {/* Paragraphs */}
                {paragraphs.map((para, i) => (
                  <p key={`${currentPage}-${i}`} className="mb-6 text-justify" style={{ textIndent: "1.5em" }}>
                    {para}
                  </p>
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <p className={`text-sm ${mutedClass}`}>Sahifada matn yo'q</p>
              </div>
            )}
          </article>
        </div>
      </div>

      {/* ═══ Bottom navigation bar ═══ */}
      <footer
        className={`shrink-0 border-t ${headerBorder} ${headerBg} flex items-center justify-between py-2 px-3 z-10`}
        style={{ minHeight: 48 }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => gotoPage(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ArrowLeft className="size-4" />
        </Button>

        <div className="flex flex-col items-center">
          <span className={`text-sm font-medium tabular-nums ${mutedClass}`}>
            {currentPage} / {totalTextPages || "—"}
          </span>
          {totalTextPages > 0 && (
            <div className="w-32 h-1 bg-muted rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${(currentPage / totalTextPages) * 100}%` }}
              />
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => gotoPage(currentPage + 1)}
          disabled={totalTextPages > 0 && currentPage >= totalTextPages}
        >
          <ArrowRight className="size-4" />
        </Button>
      </footer>
    </div>
  );
}
