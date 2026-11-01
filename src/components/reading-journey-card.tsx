"use client";

import { BookOpen, Flame, Clock, Layers } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";

interface Props {
  booksCompleted: number;
  booksStarted: number;
  pagesRead: number;
  streak: number;
  monthHours: number;
  monthMinutes: number;
}

/**
 * Profildagi YAGONA o'qish statistikasi kartasi.
 * Avval ikkita deyarli bir xil karta bor edi (ReadingJourneyCard va
 * "Reading Statistics") — endi barcha raqamlar shu yerda.
 */
export function ReadingJourneyCard({
  booksCompleted,
  booksStarted,
  pagesRead,
  streak,
  monthHours,
  monthMinutes,
}: Props) {
  const { t } = useLanguage();

  const tiles = [
    {
      icon: <BookOpen size={18} />,
      value: String(booksCompleted),
      label: t.profile.finished,
      color: "bg-primary/10 text-primary",
    },
    {
      icon: <Layers size={18} />,
      value: String(booksStarted),
      label: t.profile.started,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      icon: <Flame size={18} />,
      value: String(streak),
      label: t.profile.streak,
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      icon: <Clock size={18} />,
      value: `${monthHours > 0 ? `${monthHours}h ` : ""}${monthMinutes}m`,
      label: `${t.profile.time} (oy)`,
      color: "bg-green-500/10 text-green-600",
    },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <BookOpen size={16} className="text-primary" />
          {t.profile.stats}
        </h2>
        <span className="text-xs text-muted-foreground">
          {pagesRead.toLocaleString()} {t.profile.pages.toLowerCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 sm:p-4"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tile.color}`}
            >
              {tile.icon}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight text-foreground sm:text-2xl">
                {tile.value}
              </p>
              <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                {tile.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
