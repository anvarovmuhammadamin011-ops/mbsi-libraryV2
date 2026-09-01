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
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200",
        "hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5",
        className
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen size={32} className="text-muted-foreground/30" />
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

        {/* Favorite button */}
        {onFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite();
            }}
            className={cn(
              "absolute right-2.5 top-2.5 rounded-full p-1.5 shadow-sm transition-all duration-200",
              "bg-white/90 hover:bg-white hover:scale-105",
              "dark:bg-black/50 dark:hover:bg-black/70"
            )}
            aria-label={isFavorite ? "Sevimlilardan o'chirish" : "Sevimlilarga qo'shish"}
          >
            <Heart
              size={14}
              className={cn(
                "transition-colors",
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-500 dark:text-gray-400"
              )}
            />
          </button>
        )}

        {/* Language badge */}
        <div className="absolute left-2.5 top-2.5">
          <Badge variant="secondary" className="bg-white/90 text-[10px] font-medium dark:bg-black/50">
            {book.language}
          </Badge>
        </div>

        {/* Read button overlay */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center pb-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRead?.();
            }}
            className="gap-1.5 shadow-lg h-8 text-xs"
          >
            <BookOpen size={13} />
            {progress ? "Davom ettirish" : "O'qish"}
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-tight text-foreground">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {book.author?.name}
        </p>

        <div className="flex items-center gap-1.5 mt-0.5">
          {book.averageRating ? (
            <div className="flex items-center gap-0.5">
              <Star size={11} className="fill-yellow-400 text-yellow-400" />
              <span className="text-[11px] font-medium">{book.averageRating}</span>
            </div>
          ) : null}
          <span className="text-[11px] text-muted-foreground">·</span>
          <span className="text-[11px] text-muted-foreground">{book.totalPages} bet</span>
        </div>

        {/* Progress */}
        {progress && (
          <div className="mt-auto pt-2 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                {progress.currentPage}/{progress.totalPages}
              </span>
              <span className="font-medium text-primary">{progress.progress}%</span>
            </div>
            <Progress value={progress.progress} className="h-1" />
          </div>
        )}
      </div>
    </div>
  );
}
