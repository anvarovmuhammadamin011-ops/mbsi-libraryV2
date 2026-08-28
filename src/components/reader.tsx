"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  BookmarkPlus,
  BookmarkCheck,
  Loader2,
  ZoomIn,
  ZoomOut,
  Moon,
  Sun,
  MoreVertical,
  Type,
} from "lucide-react";
import { AiAssistant } from "@/components/ai-assistant";

interface Props {
  bookId: string;
  title: string;
  totalPages: number;
  pdfUrl: string;
  initialPage: number;
}

interface BookmarkData {
  id: string;
  page: number;
}

type ThemeMode = "light" | "dark";

export function Reader({ bookId, title, totalPages, pdfUrl, initialPage }: Props) {
  const [page, setPage] = useState(Math.min(Math.max(initialPage, 1), totalPages || 1));
  const [totalPdfPages, setTotalPdfPages] = useState(totalPages || 1);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [saving, setSaving] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showPageInput, setShowPageInput] = useState(false);
  const [pageInput, setPageInput] = useState("");

  // canvas state
  const pdfDocRef = useRef<any>(null);
  const [docReady, setDocReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [rendering, setRendering] = useState(true);

  const sessionRef = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavePageRef = useRef(initialPage);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  const isDark = theme === "dark";

  // ─── Load PDF ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf-worker/pdf.worker.min.mjs";
        const doc = await pdfjs.getDocument({ url: pdfUrl }).promise;
        if (cancelled) {
          doc.destroy();
          return;
        }
        pdfDocRef.current = doc;
        setTotalPdfPages(doc.numPages);
        setDocReady(true);
      } catch {
        if (!cancelled) {
          toast.error("PDF faylni yuklashda xatolik");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      pdfDocRef.current?.destroy?.();
      pdfDocRef.current = null;
    };
  }, [pdfUrl]);

  // ─── Fit scale ──────────────────────────────────────────────
  const recomputeFit = useCallback(async () => {
    const doc = pdfDocRef.current;
    const el = contentRef.current;
    if (!doc || !el) return;
    try {
      const pg = await doc.getPage(Math.min(Math.max(page, 1), totalPdfPages));
      const vp = pg.getViewport({ scale: 1 });
      const w = el.clientWidth - 32;
      const h = el.clientHeight - 32;
      if (w > 0 && h > 0) {
        setFitScale(Math.min(w / vp.width, h / vp.height));
      }
    } catch {
      /* ignore */
    }
  }, [page, totalPdfPages]);

  useEffect(() => {
    if (!docReady) return;
    recomputeFit();
    window.addEventListener("resize", recomputeFit);
    return () => window.removeEventListener("resize", recomputeFit);
  }, [docReady, recomputeFit]);

  // ─── Render single page ─────────────────────────────────────
  useEffect(() => {
    if (!docReady || !canvasRef.current) return;
    let cancelled = false;
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 3) : 1;

    (async () => {
      setRendering(true);
      try {
        renderTaskRef.current?.cancel();
      } catch {
        /* ignore */
      }
      try {
        const doc = pdfDocRef.current;
        const canvas = canvasRef.current;
        if (!doc || !canvas) return;
        const pg = await doc.getPage(Math.min(Math.max(page, 1), totalPdfPages));
        if (cancelled) return;
        const scale = Math.max(0.1, fitScale * zoom * dpr);
        const viewport = pg.getViewport({ scale });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const task = pg.render({
          canvasContext: ctx,
          viewport,
          canvas,
        });
        renderTaskRef.current = task;
        await task.promise;
      } catch {
        /* cancelled */
      } finally {
        if (!cancelled) {
          setRendering(false);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [docReady, page, fitScale, zoom, totalPdfPages]);

  // ─── Reading session ────────────────────────────────────────
  useEffect(() => {
    let active = true;
    api
      .post<{ sessionId: string }>("/api/reading/session/start", {
        bookId,
        startPage: page,
      })
      .then((r) => {
        if (active) sessionRef.current = r.sessionId;
      })
      .catch(() => {});
    return () => {
      active = false;
      if (sessionRef.current) {
        api
          .post("/api/reading/session/end", {
            sessionId: sessionRef.current,
            endPage: page,
          })
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Bookmarks ──────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/bookmarks?bookId=${bookId}`)
      .then((r) => r.json())
      .then((json: any) => {
        const items = Array.isArray(json?.data) ? json.data : [];
        setBookmarks(items.map((b: any) => ({ id: b.id, page: b.page })));
      })
      .catch(() => {});
  }, [bookId]);

  useEffect(() => {
    setIsBookmarked(bookmarks.some((b) => b.page === page));
  }, [page, bookmarks]);

  const saveProgress = useCallback(
    (p: number) => {
      if (p === lastSavePageRef.current) return;
      lastSavePageRef.current = p;
      setSaving(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        api
          .post("/api/reading/progress", { bookId, page: p })
          .catch(() => {})
          .finally(() => setSaving(false));
      }, 800);
    },
    [bookId]
  );

  function goto(p: number) {
    const next = Math.min(Math.max(p, 1), totalPdfPages || 1);
    if (next === page) return;
    setPage(next);
    saveProgress(next);
  }

  // ─── Keyboard ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showPageInput) return;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goto(page - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          goto(page + 1);
          break;
        case "+":
        case "=":
          e.preventDefault();
          setZoom((z) => Math.min(4, +(z + 0.2).toFixed(2)));
          break;
        case "-":
          e.preventDefault();
          setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(2)));
          break;
        case "b":
        case "B":
          e.preventDefault();
          toggleBookmark();
          break;
        case "Escape":
          if (showMenu) setShowMenu(false);
          if (showPageInput) setShowPageInput(false);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, totalPdfPages, showMenu, showPageInput]);

  // ─── Touch ──────────────────────────────────────────────────
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchRef.current = { dist: Math.hypot(dx, dy), zoom };
        return;
      }
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    [zoom]
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const next = pinchRef.current.zoom * (dist / pinchRef.current.dist);
      setZoom(Math.min(4, Math.max(0.6, +next.toFixed(2))));
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (pinchRef.current) {
        if (e.touches.length < 2) pinchRef.current = null;
        return;
      }
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (absDx > 50 && absDx > absDy * 1.5) {
        if (dx < 0) goto(page + 1);
        else goto(page - 1);
      }
      touchStartRef.current = null;
    },
    [page]
  );

  function toggleBookmark() {
    if (isBookmarked) {
      const bm = bookmarks.find((b) => b.page === page);
      if (bm) {
        api
          .delete(`/api/bookmarks/${bm.id}`)
          .then(() => {
            setBookmarks((prev) => prev.filter((b) => b.page !== page));
            setIsBookmarked(false);
            toast.success("Xatcho'p o'chirildi");
          })
          .catch((e: any) => toast.error(e.message));
      }
    } else {
      api
        .post("/api/bookmarks", { bookId, page })
        .then((res: any) => {
          const id = res?.id || Date.now().toString();
          setBookmarks((prev) => [...prev, { id, page }]);
          setIsBookmarked(true);
          toast.success(`Sahifa ${page} xatcho'pga qo'shildi`);
        })
        .catch((e: any) => toast.error(e.message));
    }
  }

  function handlePageInputSubmit() {
    const num = parseInt(pageInput, 10);
    if (isNaN(num) || num < 1 || num > totalPdfPages) {
      toast.error("Bu sahifa mavjud emas.");
      return;
    }
    goto(num);
    setShowPageInput(false);
    setPageInput("");
  }

  // ─── Colors ─────────────────────────────────────────────────
  const bgClass = isDark ? "bg-[#0B1220]" : "bg-[#F5F7FA]";
  const headerBg = isDark ? "bg-[#0F172A]" : "bg-white";
  const headerBorder = isDark ? "border-slate-700/50" : "border-slate-200";
  const textClass = isDark ? "text-white" : "text-slate-900";
  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";
  const canvasWrapBg = isDark ? "bg-[#0B1220]" : "bg-[#F5F7FA]";

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden select-none ${bgClass} ${textClass}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ═══ Top bar: 48px, border-bottom ═══ */}
      <header
        className={`flex items-center h-12 shrink-0 border-b ${headerBorder} ${headerBg} px-2 sm:px-3`}
        style={{ height: 48 }}
      >
        {/* left: back */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          className="h-8 w-8 shrink-0"
          aria-label="Orqaga"
        >
          <ArrowLeft className="size-5" />
        </Button>

        {/* center: title */}
        <div className="flex-1 min-w-0 flex justify-center px-2">
          <h1 className="text-sm font-medium truncate max-w-[60vw] sm:max-w-md text-center">
            {title}
          </h1>
        </div>

        {/* right: bookmark + more */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleBookmark}
            className="h-8 w-8"
            aria-label={isBookmarked ? "Xatcho'pni o'chirish" : "Xatcho'p qo'shish"}
          >
            {isBookmarked ? (
              <BookmarkCheck className="size-5 text-yellow-500 fill-yellow-500" />
            ) : (
              <BookmarkPlus className="size-5" />
            )}
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMenu((v) => !v)}
              className="h-8 w-8"
              aria-label="Menyu"
            >
              <MoreVertical className="size-5" />
            </Button>

            {/* dropdown menu */}
            {showMenu && (
              <div
                className={`absolute right-0 top-10 w-48 rounded-xl border shadow-lg py-2 z-40 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
              >
                <button
                  onClick={() => {
                    setTheme(isDark ? "light" : "dark");
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 ${textClass}`}
                >
                  {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  {isDark ? "Yorug' rejim" : "Tungi rejim"}
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    toggleBookmark();
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 ${textClass}`}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="size-4 text-yellow-500" />
                  ) : (
                    <BookmarkPlus className="size-4" />
                  )}
                  {isBookmarked ? "Xatcho'pni o'chirish" : "Xatcho'p qo'shish"}
                </button>
                <div className={`mx-2 my-1 border-t ${headerBorder}`} />
                <div className={`px-3 py-1 text-xs ${mutedClass}`}>
                  Sahifa {page} / {totalPdfPages}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* overlay to close menu */}
      {showMenu && (
        <div className="fixed inset-0 z-30" style={{ top: 48 }} onClick={() => setShowMenu(false)} />
      )}

      {/* ═══ Content area: centered max-w-2xl ═══ */}
      <div
        ref={contentRef}
        className={`flex-1 relative overflow-hidden flex flex-col items-center ${canvasWrapBg}`}
      >
        {/* tap zones for navigation (invisible) */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[25%] z-10"
          onClick={() => goto(page - 1)}
          aria-label="Oldingi sahifa"
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-[25%] z-10"
          onClick={() => goto(page + 1)}
          aria-label="Keyingi sahifa"
        />

        {/* centered reader card */}
        <div className="w-full max-w-2xl md:max-w-[720px] flex-1 flex flex-col items-center px-3 sm:px-6 py-4 sm:py-6 overflow-hidden">
          {/* chapter title */}
          <p className={`text-sm font-medium tracking-wide mb-3 ${mutedClass}`}>Chapter {page}</p>

          {/* canvas / text area */}
          <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden rounded-lg">
            {/* placeholder while no pdf */}
            {!docReady && !loading && (
              <div className={`w-full h-full flex items-center justify-center p-8 text-center text-sm ${mutedClass}`}>
                Kitob matni yuklanmadi. PDF manzilini tekshiring.
              </div>
            )}

            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain rounded-md shadow-sm"
              style={{ background: "#ffffff", display: docReady ? "block" : "none" }}
            />

            {(rendering || !docReady) && loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Loader2 className="size-6 animate-spin text-slate-400" />
                <p className={`text-xs ${mutedClass}`}>Yuklanmoqda...</p>
              </div>
            )}
            {rendering && docReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Loader2 className="size-5 animate-spin text-slate-400" />
              </div>
            )}
          </div>

          {/* divider line */}
          <div className={`w-full h-px mt-4 ${isDark ? "bg-slate-700/50" : "bg-slate-200"}`} />

          {/* saving indicator */}
          {saving && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${mutedClass}`}>
              <Loader2 className="size-3 animate-spin" /> Saqlanmoqda...
            </div>
          )}
        </div>
      </div>

      {/* ═══ Bottom bar: Page indicator + zoom controls ═══ */}
      <footer
        className={`shrink-0 border-t ${headerBorder} ${headerBg} flex flex-col items-center justify-center py-2 px-3`}
        style={{ minHeight: 64 }}
      >
        {/* Page indicator centered */}
        <div className="flex items-center justify-center">
          {showPageInput ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePageInputSubmit()}
                className="h-7 w-20 text-center text-xs"
                min={1}
                max={totalPdfPages}
                autoFocus
                onBlur={() => setTimeout(() => setShowPageInput(false), 200)}
              />
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handlePageInputSubmit}>
                OK
              </Button>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowPageInput(true);
                setPageInput(String(page));
              }}
              className={`text-sm font-medium tabular-nums hover:underline underline-offset-4 ${mutedClass} hover:text-foreground`}
            >
              Page {page} / {totalPdfPages}
            </button>
          )}
        </div>

        {/* controls row: −  A  + */}
        <div className="flex items-center justify-center gap-8 mt-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(2)))}
            disabled={zoom <= 0.6}
            aria-label="Kichiklashtirish"
          >
            <ZoomOut className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setZoom(1)}
            aria-label="Shrift o'lchamini tiklash"
            title={`Masshtab ${Math.round(zoom * 100)}% — tiklash`}
          >
            <Type className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setZoom((z) => Math.min(4, +(z + 0.2).toFixed(2)))}
            disabled={zoom >= 4}
            aria-label="Kattalashtirish"
          >
            <ZoomIn className="size-4" />
          </Button>
        </div>
      </footer>
      <AiAssistant />
    </div>
  );
}
