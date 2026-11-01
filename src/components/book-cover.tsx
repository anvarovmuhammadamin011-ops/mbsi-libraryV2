"use client";

import Image from "next/image";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  /** Kichik nusxa (ro'yxat/thumbs) uchun matn kichrayadi. */
  compact?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

// Sarlavhadan barqaror rang tanlash — har bir kitob doim bir xil
// "muqova" rangiga ega bo'ladi (sahifa yangilanganda o'zgarmaydi).
const PALETTES = [
  ["#1e3a8a", "#0ea5e9"],
  ["#4c1d95", "#a855f7"],
  ["#7c2d12", "#f59e0b"],
  ["#064e3b", "#10b981"],
  ["#831843", "#f43f5e"],
  ["#0f172a", "#64748b"],
  ["#134e4a", "#14b8a6"],
  ["#312e81", "#6366f1"],
];

function paletteFor(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return PALETTES[hash % PALETTES.length] as [string, string];
}

/**
 * Kitob muqovasi. Rasm bo'lmasa ham bo'sh joy emas — sarlavha va
 * muallif bilan generatsiya qilingan muqova ko'rsatiladi.
 */
export function BookCover({
  title,
  author,
  coverUrl,
  compact = false,
  className,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  priority,
}: Props) {
  if (coverUrl) {
    return (
      <Image
        src={coverUrl}
        alt={title}
        fill
        className={cn("object-cover", className)}
        sizes={sizes}
        priority={priority}
      />
    );
  }

  const [from, to] = paletteFor(title);
  const initials = title.trim().charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center overflow-hidden text-center",
        compact ? "gap-1 p-1.5" : "gap-2 p-3 sm:p-4",
        className
      )}
      style={{ background: `linear-gradient(150deg, ${from} 0%, ${to} 100%)` }}
      aria-label={title}
    >
      {/* dekorativ naqsh */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 85% 85%, rgba(0,0,0,0.35), transparent 50%)",
        }}
      />
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full bg-white/15 font-black text-white/90 backdrop-blur-sm",
          compact ? "h-7 w-7 text-xs" : "h-11 w-11 text-lg"
        )}
      >
        {initials || <BookOpen size={compact ? 12 : 18} />}
      </div>
      <p
        className={cn(
          "relative w-full font-bold leading-snug text-white drop-shadow-sm",
          compact
            ? "line-clamp-2 text-[9px]"
            : "line-clamp-3 text-[11px] sm:text-xs md:text-sm"
        )}
      >
        {title}
      </p>
      {author && (
        <p
          className={cn(
            "relative w-full truncate text-white/70",
            compact ? "text-[8px]" : "text-[9px] sm:text-[11px]"
          )}
        >
          {author}
        </p>
      )}
    </div>
  );
}
