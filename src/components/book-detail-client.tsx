"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const FAV_EVENT = "mbsi:favorite-toggle";

function dispatchFav(bookId: string, fav: boolean) {
  window.dispatchEvent(
    new CustomEvent(FAV_EVENT, { detail: { bookId, fav } })
  );
}

export function FavoriteHeartButton({
  bookId,
  initialFavorite,
}: {
  bookId: string;
  initialFavorite: boolean;
}) {
  const [fav, setFav] = useState(initialFavorite);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFav(initialFavorite);
  }, [initialFavorite]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ bookId: string; fav: boolean }>;
      if (ce.detail.bookId === bookId) setFav(ce.detail.fav);
    };
    window.addEventListener(FAV_EVENT, handler);
    return () => window.removeEventListener(FAV_EVENT, handler);
  }, [bookId]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !fav;
    // optimistic
    setFav(next);
    dispatchFav(bookId, next);
    try {
      if (next) {
        await api.post("/api/favorites", { bookId });
        toast.success("Kutubxonaga qo'shildi");
      } else {
        // try DELETE with body/query fallback, and also /api/favorites/[id]
        try {
          await api.del(`/api/favorites/${bookId}`);
        } catch {
          // fallback: DELETE with query param
          await api.del(`/api/favorites?bookId=${bookId}`);
        }
        toast.success("Kutubxonadan olib tashlandi");
      }
    } catch (err: any) {
      // revert
      setFav(!next);
      dispatchFav(bookId, !next);
      toast.error(err?.message || "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={fav ? "Sevimlilardan o'chirish" : "Sevimlilarga qo'shish"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-50"
    >
      <Heart
        size={20}
        className={fav ? "fill-red-500 text-red-500" : "text-foreground"}
      />
    </button>
  );
}

export function LibraryToggleButton({
  bookId,
  initialFavorite,
}: {
  bookId: string;
  initialFavorite: boolean;
}) {
  const [fav, setFav] = useState(initialFavorite);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFav(initialFavorite);
  }, [initialFavorite]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ bookId: string; fav: boolean }>;
      if (ce.detail.bookId === bookId) setFav(ce.detail.fav);
    };
    window.addEventListener(FAV_EVENT, handler);
    return () => window.removeEventListener(FAV_EVENT, handler);
  }, [bookId]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !fav;
    setFav(next);
    dispatchFav(bookId, next);
    try {
      if (next) {
        await api.post("/api/favorites", { bookId });
        toast.success("Kutubxonaga qo'shildi");
      } else {
        try {
          await api.del(`/api/favorites/${bookId}`);
        } catch {
          await api.del(`/api/favorites?bookId=${bookId}`);
        }
        toast.success("Kutubxonadan olib tashlandi");
      }
    } catch (err: any) {
      setFav(!next);
      dispatchFav(bookId, !next);
      toast.error(err?.message || "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  }

  if (fav) {
    return (
      <button
        onClick={toggle}
        disabled={busy}
        className="flex h-12 w-full items-center justify-center rounded-full border border-border bg-background font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
      >
        ✓ IN LIBRARY
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="flex h-12 w-full items-center justify-center rounded-full border border-border bg-background font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
    >
      + MY LIBRARY
    </button>
  );
}
