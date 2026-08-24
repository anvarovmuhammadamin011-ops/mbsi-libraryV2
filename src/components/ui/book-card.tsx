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
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1",
        className
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <Image
          src={book.coverUrl}
          alt={book.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Favorite button */}
        {onFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite();
            }}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-sm transition-all hover:bg-white hover:scale-110 dark:bg-black/50 dark:hover:bg-black/70"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              size={16}
              className={cn(
                "transition-colors",
                isFavorite
                  ? "fill-red-500 text-red-500"
                  : "text-gray-600 dark:text-gray-300"
              )}
            />
          </button>
        )}

        {/* Language badge */}
        <div className="absolute left-3 top-3">
          <Badge variant="secondary" className="bg-white/90 text-xs dark:bg-black/50">
            {book.language}
          </Badge>
        </div>

        {/* Read button overlay */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center pb-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRead?.();
            }}
            className="gap-2 shadow-lg"
          >
            <BookOpen size={14} />
            {progress ? "Davom ettirish" : "O'qishni boshlash"}
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground">
          {book.author?.name}
        </p>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{book.averageRating ?? 0}</span>
          </div>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{book.totalPages} bet</span>
        </div>

        {book.category && (
          <Badge variant="outline" className="w-fit text-[10px]">
            {book.category.name}
          </Badge>
        )}

        {/* Progress */}
        {progress && (
          <div className="mt-auto space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {progress.currentPage} / {progress.totalPages}
              </span>
              <span className="font-medium text-primary">{progress.progress}%</span>
            </div>
            <Progress value={progress.progress} className="h-1.5" />
          </div>
        )}
      </div>
    </div>
  );
}
