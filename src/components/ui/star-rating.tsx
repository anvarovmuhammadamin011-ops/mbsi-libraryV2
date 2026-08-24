"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 16,
  interactive = false,
  onRate,
  className,
}: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxRating }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= rating;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(starValue)}
            className={cn(
              "transition-colors",
              interactive && "cursor-pointer hover:scale-110"
            )}
          >
            <Star
              size={size}
              className={cn(
                "transition-colors",
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-gray-300 dark:text-gray-600"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
