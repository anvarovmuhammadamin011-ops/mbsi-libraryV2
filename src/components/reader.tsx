"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  BookmarkPlus,
  BookmarkCheck,
  Loader2,
  ArrowLeft,
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Moon,
  Sun,
  Monitor,
  Columns,
  Rows3,
  Keyboard,
} from "lucide-react";

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

type ThemeMode = "light" | "dark" | "system";

export function Reader({ bookId, title, totalPages, pdfUrl, initialPage }: Props) {
  const [page, setPage] = useState(Math.min(Math.max(initialPage, 1), totalPages || 1));
  const [totalPdfPages] = useState(totalPages);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [saving, setSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageInput, setPageInput] = useState("");
  const [showPageInput, setShowPageInput] = useState(false);
  const [transition, setTransition] = useState<"none" | "fade">("none");
  const [hintText, setHintText] = useState<string | null>(null);

  const sessionRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavePageRef = useRef(initialPage);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const progressPct = totalPdfPages ? Math.round((page / totalPdfPages) * 100) : 0;

  const currentTheme = useMemo(() => {
    if (theme === "system") {
      return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  }, [theme]);

  const isDark = currentTheme === "dark";

  // ─── PDF iframe URL — single page, full width, no toolbar ─
  const pdfSrc = useMemo(() => {
    return `${pdfUrl}#page=${page}&zoom=page-fit&toolbar=0&navpanes=0&scrollbar=0&statusbar=0`;
  }, [pdfUrl, page]);

  // ─── Reading Session ──────────────────────────────────────
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Bookmarks ────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/bookmarks?bookId=${bookId}`)
      .then((r) => r.json())
      .then((json: any) => {
        const items = Array.isArray(json?.data) ? json.data : [];
        setBookmarks(items.map((b: any) => ({ id: b.id, page: b.page })));
      })
      .catch(() => {});
  }, [bookId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setIsBookmarked(bookmarks.some((b) => b.page === page));
  }, [page, bookmarks]);

  // ─── Save Progress (debounced) ────────────────────────────
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

  // ─── Navigation ───────────────────────────────────────────
  function goto(p: number, animate = true) {
    const next = Math.min(Math.max(p, 1), totalPdfPages || 1);
    if (next === page) return;
    if (animate) setTransition("fade");
    setPage(next);
    saveProgress(next);
    setTimeout(() => setTransition("none"), 200);
  }

  // ─── Keyboard Shortcuts ───────────────────────────────────
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
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "b":
        case "B":
          e.preventDefault();
          toggleBookmark();
          break;
        case "Escape":
          if (showSettings) setShowSettings(false);
          else if (isFullscreen) toggleFullscreen();
          break;
      }
      resetHideTimer();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [page, totalPdfPages, isFullscreen, showSettings, showPageInput]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Touch Swipe ──────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
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
    [page] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ─── Mouse Click Zones ────────────────────────────────────
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const w = rect.width;

      if (x < w * 0.25) goto(page - 1);
      else if (x > w * 0.75) goto(page + 1);
      else {
        setShowControls((prev) => !prev);
        if (showSettings) setShowSettings(false);
      }
    },
    [page, showSettings] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ─── Auto-hide Controls ───────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!showSettings) setShowControls(false);
    }, 3000);
  }, [showSettings]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [page, resetHideTimer]);

  // ─── Fullscreen ───────────────────────────────────────────
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ─── Bookmark Toggle ──────────────────────────────────────
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

  // ─── Page Input ───────────────────────────────────────────
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

  // ─── Hint Toast ───────────────────────────────────────────
  useEffect(() => {
    setHintText("Ekran bosishi orqali sahifalarni almashtiring");
    const t = setTimeout(() => setHintText(null), 3000);
    return () => clearTimeout(t);
  }, []);

  // ─── Color Classes ────────────────────────────────────────
  const bgClass = isDark ? "bg-[#0B1220]" : "bg-[#F5F7FA]";
  const headerBg = isDark ? "bg-[#0F172A]/95" : "bg-white/95";
  const headerBorder = isDark ? "border-slate-700/50" : "border-slate-200";
  const textClass = isDark ? "text-white" : "text-slate-900";
  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";
  const controlBg = isDark ? "bg-slate-800/90" : "bg-white/90";

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col select-none overflow-hidden ${bgClass} ${textClass}`}
      onMouseMove={resetHideTimer}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: "pan-y" }}
    >
      {/* ═══ Loading State ═══ */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-50 bg-white dark:bg-[#0B1220]">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent" />
          </div>
          <p className={`text-sm ${mutedClass}`}>📖 Kitob yuklanmoqda...</p>
        </div>
      )}

      {/* ═══ Header ═══ */}
      <header
        className={`flex items-center justify-between px-3 py-2 transition-all duration-300 ${headerBg} border-b ${headerBorder} backdrop-blur-sm ${
          showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        }`}
        style={{ height: 48, zIndex: 30 }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="h-8 w-8 shrink-0"
            aria-label="Orqaga"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium truncate">{title}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={toggleBookmark} className="h-8 w-8"
            aria-label={isBookmarked ? "Xatcho'pni o'chirish" : "Xatcho'p qo'shish"}>
            {isBookmarked ? <BookmarkCheck className="size-4 text-yellow-500 fill-yellow-500" /> : <BookmarkPlus className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => { setShowSettings(!showSettings); setShowControls(true); if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }}
            aria-label="Sozlamalar">
            <Settings className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8"
            aria-label={isFullscreen ? "To'liq ekrandan chiqish" : "To'liq ekran"}>
            {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </Button>
        </div>
      </header>

      {/* ═══ Settings Panel ═══ */}
      <div
        className={`absolute top-12 right-2 z-40 w-60 rounded-xl border shadow-xl p-3 transition-all duration-200 ${controlBg} ${headerBorder} ${
          showSettings ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="mb-3">
          <p className={`text-xs font-medium mb-1.5 ${mutedClass}`}>Mavzu</p>
          <div className="flex gap-1">
            {([
              ["light", <Sun className="size-3" />],
              ["dark", <Moon className="size-3" />],
              ["system", <Monitor className="size-3" />],
            ] as [ThemeMode, React.ReactNode][]).map(([mode, icon]) => (
              <Button key={mode} variant={theme === mode ? "default" : "outline"} size="sm"
                className="h-7 text-xs flex-1" onClick={() => setTheme(mode)}>
                {icon}
              </Button>
            ))}
          </div>
        </div>
        <div className={`border-t pt-2 ${headerBorder}`}>
          <p className={`text-xs font-medium mb-1 ${mutedClass}`}>
            <Keyboard className="size-3 inline mr-1" /> Klaviatura
          </p>
          <div className={`text-[10px] ${mutedClass} space-y-0.5`}>
            <div className="flex justify-between"><span>← →</span><span>Sahifa almashtirish</span></div>
            <div className="flex justify-between"><span>F</span><span>To'liq ekran</span></div>
            <div className="flex justify-between"><span>B</span><span>Xatcho'p</span></div>
          </div>
        </div>
      </div>

      {/* ═══ PDF Content — FULL SCREEN ═══ */}
      <div
        className="flex-1 relative"
        onClick={handleClick}
        style={{ cursor: showControls ? "default" : "none" }}
      >
        {/* Left touch zone */}
        <div className="absolute left-0 top-0 bottom-0 w-[25%] z-10"
          onClick={(e) => { e.stopPropagation(); goto(page - 1); }} />

        {/* Right touch zone */}
        <div className="absolute right-0 top-0 bottom-0 w-[25%] z-10"
          onClick={(e) => { e.stopPropagation(); goto(page + 1); }} />

        {/* Center tap zone */}
        <div className="absolute left-[25%] right-[25%] top-0 bottom-0 z-10"
          onClick={(e) => { e.stopPropagation(); setShowControls((prev) => !prev); if (showSettings) setShowSettings(false); }} />

        {/* PDF iframe — takes up ALL available space, no constraints */}
        <div className={`absolute inset-0 transition-opacity duration-200 ${transition === "fade" ? "opacity-0" : "opacity-100"}`}>
          <iframe
            key={pdfSrc}
            src={pdfSrc}
            title={title}
            className="w-full h-full border-0"
            style={{ background: "white" }}
            onLoad={() => setLoading(false)}
          />
        </div>

        {/* Side Arrows */}
        {showControls && page > 1 && (
          <button onClick={(e) => { e.stopPropagation(); goto(page - 1); }}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-opacity ${controlBg} border ${headerBorder}`}
            aria-label="Oldingi sahifa">
            <ChevronLeft className="size-5" />
          </button>
        )}
        {showControls && page < totalPdfPages && (
          <button onClick={(e) => { e.stopPropagation(); goto(page + 1); }}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-opacity ${controlBg} border ${headerBorder}`}
            aria-label="Keyingi sahifa">
            <ChevronRight className="size-5" />
          </button>
        )}

        {/* Page Badge */}
        <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full text-xs transition-opacity duration-300 ${controlBg} border ${headerBorder} shadow-sm ${
          showControls ? "opacity-100" : "opacity-0"}`}>
          {page} / {totalPdfPages}
        </div>

        {saving && (
          <div className="absolute top-3 right-3 z-20">
            <Loader2 className="size-3 animate-spin text-blue-400" />
          </div>
        )}
      </div>

      {/* ═══ Bottom Controls ═══ */}
      <div
        className={`${controlBg} border-t ${headerBorder} backdrop-blur-sm transition-all duration-300 ${
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
        }`}
        style={{ height: 52, zIndex: 30 }}
      >
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); goto(page - 1); }}
              disabled={page <= 1} aria-label="Oldingi sahifa">
              <ChevronLeft className="size-4" />
            </Button>

            {showPageInput ? (
              <div className="flex items-center gap-1">
                <Input type="number" value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePageInputSubmit()}
                  className="h-7 w-14 text-center text-xs" min={1} max={totalPdfPages} autoFocus
                  onBlur={() => setTimeout(() => setShowPageInput(false), 200)} />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePageInputSubmit}>
                  <ChevronRight className="size-3" />
                </Button>
              </div>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); setShowPageInput(true); setPageInput(String(page)); }}
                className={`text-xs font-mono px-2 py-1 rounded hover:bg-black/5 ${mutedClass}`}>
                {page} / {totalPdfPages}
              </button>
            )}

            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); goto(page + 1); }}
              disabled={page >= totalPdfPages} aria-label="Keyingi sahifa">
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3 flex-1 mx-4 max-w-md">
            <Progress value={progressPct} className="h-1.5 flex-1" />
            <span className={`text-xs font-mono ${mutedClass}`}>{progressPct}%</span>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); toggleBookmark(); }}
              aria-label={isBookmarked ? "Xatcho'p o'chirish" : "Xatcho'p qo'shish"}>
              {isBookmarked ? <BookmarkCheck className="size-4 text-yellow-500 fill-yellow-500" /> : <BookmarkPlus className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              aria-label="To'liq ekran">
              {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ Hint Toast ═══ */}
      {hintText && (
        <div className={`absolute bottom-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs ${controlBg} border ${headerBorder} ${mutedClass}`}>
          {hintText}
        </div>
      )}
    </div>
  );
}
