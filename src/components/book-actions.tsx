"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { Heart, BookmarkPlus, BookOpen, Check } from "lucide-react";
import type { Book } from "@/types";

export function BookActions({
  book,
  initialFavorite,
  initialRating,
  currentPage,
}: {
  book: Book;
  initialFavorite: boolean;
  initialRating: number | null;
  currentPage: number;
}) {
  const router = useRouter();
  const [fav, setFav] = useState(initialFavorite);
  const [rating, setRating] = useState(initialRating ?? 0);
  const [busy, setBusy] = useState(false);

  async function toggleFav() {
    if (busy) return;
    setBusy(true);
    try {
      if (fav) {
        await api.del(`/api/favorites/${book.id}`);
        setFav(false);
        toast.success("Sevimlilardan o'chirildi");
      } else {
        await api.post(`/api/favorites`, { bookId: book.id });
        setFav(true);
        toast.success("Sevimlilarga qo'shildi");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function addBookmark() {
    try {
      await api.post(`/api/bookmarks`, { bookId: book.id, page: currentPage || 1 });
      toast.success(`Sahifa ${currentPage || 1} xatcho'pga qo'shildi`);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function onRate(r: number) {
    try {
      await api.post(`/api/ratings`, { bookId: book.id, rating: r });
      setRating(r);
      toast.success("Bahoyingiz saqlandi");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const hasProgress = currentPage > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button
          size="lg"
          render={<Link href={`/reader/${book.slug}`} />}
          className="gap-2"
        >
          <BookOpen size={16} />
          {hasProgress ? "Davom ettirish" : "O'qishni boshlash"}
        </Button>
        <Button variant="outline" size="lg" onClick={toggleFav} className="gap-2">
          <Heart size={16} className={fav ? "fill-red-500 text-red-500" : ""} />
          {fav ? "Sevimlida" : "Sevimliga"}
        </Button>
        <Button variant="outline" size="lg" onClick={addBookmark} className="gap-2">
          <BookmarkPlus size={16} />
          Xatcho'p
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <StarRating rating={rating} interactive onRate={onRate} size={20} />
        <span className="text-sm text-muted-foreground">
          {book.averageRating ?? 0} ({book.ratingCount ?? 0} baho)
        </span>
      </div>
    </div>
  );
}
