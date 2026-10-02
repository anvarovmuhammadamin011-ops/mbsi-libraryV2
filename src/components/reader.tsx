"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  ZoomIn,
  ZoomOut,
  Moon,
  Sun,
  Type,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useTheme } from "next-themes";

interface Props {
  bookId: string;
  title: string;
  totalPages: number;
  pdfUrl: string;
  initialPage: number;
}

export function Reader({ bookId, title, totalPages, pdfUrl, initialPage }: Props) {
  const [page, setPage] = useState(Math.min(Math.max(initialPage, 1), totalPages || 1));
  const [totalPdfPages, setTotalPdfPages] = useState(totalPages || 1);
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // canvas state
  const pdfDocRef = useRef<any>(null);
  const [docReady, setDocReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // Canvas haqiqiy egallaydigan quti — shu qutidan o'lcham olinadi,
  // aks holda fitScale kattalashib, sahifa ekranni to'liq to'ldirmaydi.
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  /**
   * false — "butun sahifa" rejimi (matn to'liq ko'rinadi, telefon
   *         ekranining ~53-73% egallanadi).
   * true  — "to'ldirish" rejimi: sahifa balandlik bo'yicha ekranni
   *         to'liq egallaydi, matn KESILMAYDI, lekin chap/o'ngdan
   *         surish kerak bo'ladi.
   */
  const [fillMode, setFillMode] = useState(false);
  // Canvas'ning ko'rinadigan (CSS px) o'lchami — render'dan keyin yoziladi
  const [cssSize, setCssSize] = useState<{ w: number; h: number } | null>(null);
  const [rendering, setRendering] = useState(true);

  const sessionRef = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavePageRef = useRef(initialPage);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  // Sessiyani yakunlash: keepalive bilan — hard navigation / tab yopilganda
  // ham so'rov bekor qilinmaydi. Oxirgi ko'rilgan sahifa ref'dan olinadi
  // (cleanup closure'dagi eski `page` emas).
  const endSessionBeacon = useCallback((sessionId: string, endPage: number) => {
    const m = document.cookie.match(/(?:^|;\s*)mbsi_csrf=([^;]*)/);
    const csrf = m ? decodeURIComponent(m[1]) : "";
    try {
      void fetch("/api/reading/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ sessionId, endPage }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  }, []);

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
  // Butun sahifa rejimida ikkala o'lcham ham sig'adi (contain).
  // To'ldirish rejimida balandlik bo'yicha sig'adi (matn kesilmaydi),
  // kenglikda skroll paydo bo'ladi.
  const recomputeFit = useCallback(async () => {
    const doc = pdfDocRef.current;
    const el = canvasAreaRef.current;
    if (!doc || !el) return;
    try {
      const pg = await doc.getPage(Math.min(Math.max(page, 1), totalPdfPages));
      const vp = pg.getViewport({ scale: 1 });
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) {
        const wScale = w / vp.width;
        const hScale = h / vp.height;
        setFitScale(fillMode ? hScale : Math.min(wScale, hScale));
      }
    } catch {
      /* ignore */
    }
  }, [page, totalPdfPages, fillMode]);

  useEffect(() => {
    if (!docReady) return;
    recomputeFit();
    window.addEventListener("resize", recomputeFit);
    return () => window.removeEventListener("resize", recomputeFit);
  }, [docReady, recomputeFit]);

  // Sahifa yoki rejim o'zgarganda skrollni boshiga qaytaramiz —
  // aks holda keyingi sahifa o'rnidan siljigan holda ko'rinadi.
  useEffect(() => {
    const el = canvasAreaRef.current;
    if (el) {
      el.scrollLeft = 0;
      el.scrollTop = 0;
    }
  }, [page, fillMode]);

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
        // CSS o'lcham: backing store / dpr. Aniq px beriladi, chunki
        // "to'ldirish" rejimida canvas konteynerdan kengroq bo'lishi
        // kerak (kesimmaslik uchun) va max-w-full uni qisqartirib yuborardi.
        setCssSize({
          w: Math.round(viewport.width / dpr),
          h: Math.round(viewport.height / dpr),
        });
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
      .catch((e) => {
        if (e instanceof ApiClientError && e.code === "BOOK_LIMIT_REACHED") {
          toast.error("Faol kitoblar limiti to'lgan", {
            description: "O'qish davom etadi, lekin progress saqlanmaydi. Davom etish uchun 'Kutubxonam' dan bir kitobni tugating.",
          });
        }
      });

    // Hard navigation / tab yopishda React cleanup ishga tushmaydi —
    // shuning uchun pagehide'da ham sessiyani yakunlaymiz (keepalive bilan).
    const handlePageHide = () => {
      if (sessionRef.current) {
        endSessionBeacon(sessionRef.current, lastSavePageRef.current);
        sessionRef.current = null;
      }
    };
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      active = false;
      window.removeEventListener("pagehide", handlePageHide);
      if (sessionRef.current) {
        endSessionBeacon(sessionRef.current, lastSavePageRef.current);
        sessionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endSessionBeacon]);

  const saveProgress = useCallback(
    (p: number) => {
      if (p === lastSavePageRef.current) return;
      lastSavePageRef.current = p;
      setSaving(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        api
          .post("/api/reading/progress", { bookId, page: p })
          .catch((e) => {
            if (e instanceof ApiClientError && e.code === "BOOK_LIMIT_REACHED") {
              toast.error("Progress saqlanmadi — faol kitoblar limiti to'lgan", {
                description: "Kitobni tugatish uchun 'Kutubxonam' dan boshqa kitobni yoping.",
              });
            }
          })
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

  function prevPage() {
    goto(page - 1);
  }

  function nextPage() {
    goto(page + 1);
  }

  // ─── Keyboard ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, totalPdfPages]);

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
      // "To'ldirish" rejimida sahifa ekrandan kengroq bo'ladi —
      // gorizontal surish sahifani ko'chirish uchun kerak, shuning
      // uchun o'zgarish bu yerda o'chiriladi (sahifa tugmalar/klaviatura
      // orqali almashtiriladi).
      if (fillMode) {
        touchStartRef.current = null;
        return;
      }
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
    [page, fillMode]
  );

  // ─── Colors ─────────────────────────────────────────────────
  const bgClass = isDark ? "bg-[#0B1220]" : "bg-[#F5F7FA]";
  const headerBg = isDark ? "bg-[#0F172A]" : "bg-white";
  const headerBorder = isDark ? "border-slate-700/50" : "border-slate-200";
  const textClass = isDark ? "text-white" : "text-slate-900";
  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";
  const canvasWrapBg = isDark ? "bg-[#0B1220]" : "bg-[#F5F7FA]";

  return (
    <div
      className={`reader-root z-50 flex flex-col overflow-hidden select-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${bgClass} ${textClass}`}
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

        {/* right: fill-mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setFillMode((v) => !v)}
          className="h-8 w-8 shrink-0"
          aria-label={fillMode ? "Butun sahifani ko'rsatish" : "Ekranni to'ldirish"}
          title={fillMode ? "Butun sahifa" : "Ekranni to'ldirish"}
        >
          {fillMode ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
        </Button>

        {/* theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="h-8 w-8 shrink-0"
          aria-label={isDark ? "Yorug' rejim" : "Tungi rejim"}
        >
          {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
      </header>

      {/* ═══ Content area ═══ */}
      <div
        ref={contentRef}
        className={`flex-1 min-h-0 relative overflow-hidden flex flex-col ${canvasWrapBg}`}
      >
        {/* centered reader card */}
        <div className="w-full max-w-2xl md:max-w-[720px] min-h-0 flex-1 flex flex-col items-center overflow-hidden sm:px-6 sm:py-6">
          {/* canvas / text area */}
          <div
            ref={canvasAreaRef}
            className="flex-1 min-h-0 w-full flex relative overflow-auto rounded-lg scrollbar-thin"
            data-fill={fillMode ? "on" : "off"}
          >
            {/* placeholder while no pdf */}
            {!docReady && !loading && (
              <div className={`w-full h-full flex items-center justify-center p-8 text-center text-sm ${mutedClass}`}>
                Kitob matni yuklanmadi. PDF manzilini tekshiring.
              </div>
            )}

            {/* m-auto: canvas konteynerdan keng bo'lganda ham chap/o'ng
                chekkasi kesilmaydi (justify-center bug'ini oldi oladi) */}
            <div className="m-auto shrink-0">
              <canvas
                ref={canvasRef}
                className="block rounded-md shadow-sm"
                style={{
                  background: "#ffffff",
                  display: docReady ? "block" : "none",
                  width: cssSize ? `${cssSize.w}px` : undefined,
                  height: cssSize ? `${cssSize.h}px` : undefined,
                  // Dark mode: invert the white page to dark (hue-rotate keeps colors natural)
                  filter: isDark ? "invert(1) hue-rotate(180deg)" : "none",
                }}
              />
            </div>

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
        </div>

        {/* saving indicator (overlay — joy egallamaydi) */}
        {saving && (
          <div
            className={`pointer-events-none absolute bottom-2 right-3 flex items-center gap-1 rounded-full px-2 py-1 text-xs backdrop-blur ${mutedClass} ${headerBg}`}
          >
            <Loader2 className="size-3 animate-spin" /> Saqlanmoqda...
          </div>
        )}
      </div>

      {/* ═══ Desktop nav buttons (visible only on md+) ═══ */}
      <div className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700"
          onClick={prevPage}
          disabled={page <= 1}
          aria-label="Oldingi sahifa"
        >
          <ArrowLeft className="size-5" />
        </Button>
      </div>
      <div className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700"
          onClick={nextPage}
          disabled={page >= totalPdfPages}
          aria-label="Keyingi sahifa"
        >
          <ArrowRight className="size-5" />
        </Button>
      </div>

      {/* ═══ Bottom bar: Page indicator + zoom controls ═══ */}
      <footer
        className={`shrink-0 border-t ${headerBorder} ${headerBg} flex flex-col items-center justify-center py-2 px-3`}
        style={{ minHeight: 64 }}
      >
        {/* Page indicator centered */}
        <div className="flex items-center justify-center">
          <span className={`text-sm font-medium tabular-nums ${mutedClass}`}>
            Sahifa {page} / {totalPdfPages}
          </span>
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
    </div>
  );
}
