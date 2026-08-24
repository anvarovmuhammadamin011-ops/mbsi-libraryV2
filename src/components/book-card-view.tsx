"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookCard } from "@/components/ui/book-card";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import type { Book, ReadingProgress } from "@/types";

export function BookCardView({
  book,
  progress,
  initialFavorite = false,
}: {
  book: Book;
  progress?: ReadingProgress;
  initialFavorite?: boolean;
}) {
  const router = useRouter();
  const [fav, setFav] = useState(initialFavorite);
  const [busy, setBusy] = useState(false);

  async function toggleFav() {
    if (busy) return;
    setBusy(true);
    try {
      if (fav) {
        await api.del(`/api/favorites/${book.id}`);
        setFav(false);
      } else {
        await api.post(`/api/favorites`, { bookId: book.id });
        setFav(true);
      }
    } catch (err: any) {
      toast.error(err.message || "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  return (
    <BookCard
      book={book}
      progress={progress}
      isFavorite={fav}
      onRead={() => router.push(`/books/${book.slug}`)}
      onFavorite={toggleFav}
    />
  );
}
