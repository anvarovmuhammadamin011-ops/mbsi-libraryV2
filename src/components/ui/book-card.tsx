"use client";

import Image from "next/image";
import { BookOpen, Heart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Book, ReadingProgress } from "@/types";

interface BookCardProps {
  book: Book;
  progress?: ReadingProgress;
  isFavorite?: boolean;
  onRead?: () => void;
  onFavorite?: () => void;
  className?: string;
}

export function BookCard({
  book,
  progress,
  isFavorite = false,
  onRead,
  onFavorite,
  className,
}: BookCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1",
        "dark:hover:shadow-primary/15 dark:shadow-lg dark:shadow-black/20",
        className
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted dark:bg-[#0E1629]">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/15 dark:via-primary/8 dark:to-transparent">
            <BookOpen size={32} className="text-primary/25 dark:text-primary/35" />
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-black/70 dark:via-black/20" />

        {/* Favorite button */}
        {onFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite();
            }}
            className={cn(
              "absolute right-2.5 top-2.5 rounded-full p-1.5 shadow-md transition-all duration-200",
              "bg-white/95 hover:bg-white hover:scale-110",
              "dark:bg-black/60 dark:hover:bg-black/80 dark:backdrop-blur-sm",
              "active:scale-95"
            )}
            aria-label={isFavorite ? "Sevimlilardan o'chirish" : "Sevimlilarga qo'shish"}
          >
            <Heart
              size={14}
              className={cn(
                "transition-all duration-200",
                isFavorite ? "fill-red-500 text-red-500 drop-shadow-sm" : "text-gray-500 dark:text-gray-300"
              )}
            />
          </button>
        )}

        {/* Language badge */}
        <div className="absolute left-2.5 top-2.5">
          <Badge variant="secondary" className="bg-white/95 text-[10px] font-medium shadow-sm dark:bg-black/60 dark:text-white/90 dark:backdrop-blur-sm">
            {book.language}
          </Badge>
        </div>

        {/* Read button overlay */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center pb-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRead?.();
            }}
            className="gap-1.5 shadow-lg h-8 text-xs backdrop-blur-sm bg-primary/90 hover:bg-primary dark:bg-primary/95 dark:hover:bg-primary"
          >
            <BookOpen size={13} />
            {progress ? "Davom ettirish" : "O'qish"}
          </Button>
        </div>
      </div>

      {/* Info — fixed-height blocks so every card is the same size */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 h-10 text-sm font-bold leading-snug text-foreground">
          {book.title}
        </h3>
        <p className="mt-0.5 h-5 truncate text-xs text-muted-foreground">
          {book.author?.name ?? "Noma'lum muallif"}
        </p>

        <div className="mt-auto flex h-6 items-center gap-2">
          {book.averageRating ? (
            <>
              <div className="flex items-center gap-1">
                <Star size={13} className="fill-yellow-400 text-yellow-400 dark:drop-shadow-[0_0_3px_rgba(250,204,21,0.5)]" />
                <span className="text-sm font-semibold">{Number(book.averageRating).toFixed(1)}</span>
              </div>
              <span className="text-sm text-muted-foreground">·</span>
            </>
          ) : (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
              Yangi
            </span>
          )}
          <span className="text-sm text-muted-foreground">{book.totalPages} bet</span>
        </div>

        {/* Progress */}
        {progress && (
          <div className="mt-1 h-9 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {progress.currentPage}/{progress.totalPages}
              </span>
              <span className="font-medium text-primary dark:text-primary">{progress.progress}%</span>
            </div>
            <Progress value={progress.progress} className="h-1.5 dark:[&_[data-slot=progress-indicator]]:shadow-[0_0_6px_rgba(96,165,250,0.4)]" />
          </div>
        )}
      </div>
    </div>
  );
}
