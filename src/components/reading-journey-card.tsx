"use client";

import { BookOpen, Flame, Clock } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";

interface Props {
  booksCompleted: number;
  streak: number;
  monthHours: number;
  monthMinutes: number;
}

export function ReadingJourneyCard({
  booksCompleted,
  streak,
  monthHours,
  monthMinutes,
}: Props) {
  const { t } = useLanguage();

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
        <BookOpen size={18} className="text-primary" />
        {t.profile.stats}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Books Completed */}
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{booksCompleted}</p>
            <p className="text-xs text-muted-foreground">{t.profile.finished}</p>
          </div>
        </div>

        {/* Reading Streak */}
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
            <Flame size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{streak}</p>
            <p className="text-xs text-muted-foreground">{t.profile.streak}</p>
          </div>
        </div>

        {/* Monthly Reading Time */}
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {monthHours > 0 ? `${monthHours}h` : ""} {monthMinutes}m
            </p>
            <p className="text-xs text-muted-foreground">{t.profile.time} (oy)</p>
          </div>
        </div>
      </div>
    </section>
  );
}
