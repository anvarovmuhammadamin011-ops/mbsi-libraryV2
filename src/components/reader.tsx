"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  BookmarkPlus,
  Loader2,
  Hand,
} from "lucide-react";

interface Props {
  bookId: string;
  title: string;
  totalPages: number;
  pdfUrl: string;
  initialPage: number;
}

export function Reader({ bookId, title, totalPages, pdfUrl, initialPage }: Props) {
  const [page, setPage] = useState(Math.min(Math.max(initialPage, 1), totalPages || 1));
  const [zoom, setZoom] = useState("100");
  const [saving, setSaving] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const sessionRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartPageRef = useRef<number>(0);

  const progressPct = totalPages ? Math.round((page / totalPages) * 100) : 0;

  // Start a reading session on mount.
  useEffect(() => {
    let active = true;
    api
      .post<{ sessionId: string }>("api/reading/session/start", {
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
          .post("api/reading/session/end", {
            sessionId: sessionRef.current,
            endPage: page,
          })
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hide swipe hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowSwipeHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const saveProgress = useCallback(
    (p: number) => {
      setSaving(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        api
          .post("api/reading/progress", { bookId, page: p })
          .catch(() => {})
          .finally(() => setSaving(false));
      }, 700);
    },
    [bookId]
  );

  function goto(p: number) {
    const next = Math.min(Math.max(p, 1), totalPages || 1);
    setPage(next);
    saveProgress(next);
  }

  function addBookmark() {
    api
      .post("api/bookmarks", { bookId, page })
      .then(() => toast.success(`Sahifa ${page} xatcho'pga qo'shildi`))
      .catch((e: any) => toast.error(e.message));
  }

  function fullscreen() {
    containerRef.current?.requestFullscreen?.();
  }

  // Touch/swipe handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchStartPageRef.current = page;
  }, [page]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Prevent default scrolling while swiping
    if (touchStartRef.current) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const minSwipeDistance = 50;

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX < 0) {
          // Swipe left → next page
          goto(touchStartPageRef.current + 1);
        } else {
          // Swipe right → previous page
          goto(touchStartPageRef.current - 1);
        }
      }

      touchStartRef.current = null;
    },
    [goto]
  );

  const src = `${pdfUrl}#page=${page}&zoom=${zoom}`;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => goto(page - 1)} disabled={page <= 1}>
          <ChevronLeft />
        </Button>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={page}
            min={1}
            max={totalPages}
            onChange={(e) => goto(Number(e.target.value) || 1)}
            className="h-8 w-20 text-center"
          />
          <span className="text-sm text-muted-foreground">/ {totalPages}</span>
        </div>
        <Button variant="outline" size="icon" onClick={() => goto(page + 1)} disabled={page >= totalPages}>
          <ChevronRight />
        </Button>

        <div className="flex flex-1 items-center gap-2">
          <Progress value={progressPct} className="h-2 flex-1" />
          <span className="w-12 text-right text-sm font-medium text-primary">{progressPct}%</span>
          {saving && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>

        <Select value={zoom} onValueChange={(v) => v && setZoom(v)}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="100">100%</SelectItem>
            <SelectItem value="125">125%</SelectItem>
            <SelectItem value="150">150%</SelectItem>
            <SelectItem value="200">200%</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fullscreen} title="To'liq ekran">
          <Maximize />
        </Button>
        <Button variant="outline" size="icon" onClick={addBookmark} title="Xatcho'p">
          <BookmarkPlus />
        </Button>
      </div>

      {/* PDF Viewer with swipe support */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden rounded-xl border bg-muted"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <iframe
          key={src}
          src={src}
          title={title}
          className="h-full w-full pointer-events-none"
          style={{ touchAction: "none" }}
        />

        {/* Mobile swipe hint */}
        {showSwipeHint && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none animate-fade-in md:hidden">
            <div className="bg-white/90 rounded-xl px-6 py-4 shadow-lg flex items-center gap-3">
              <Hand className="size-6 text-primary animate-pulse" />
              <div className="text-sm">
                <p className="font-semibold">Chapga surish → Keyingi sahifa</p>
                <p className="text-muted-foreground">O'ngga surish → Oldingi sahifa</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {title} — PDF faqat online o'qish uchun. Yuklab olish o'chirilgan.
      </p>
    </div>
  );
}
