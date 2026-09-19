"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface AboutAppSectionProps {
  allBooksCount: number;
  totalUsers: number;
  totalAuthors: number;
  totalCategories: number;
  t: Dictionary;
}

export function AboutAppSection({
  allBooksCount,
  totalUsers,
  totalAuthors,
  totalCategories,
  t,
}: AboutAppSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-base font-medium text-foreground transition-colors hover:bg-muted/50"
      >
        <span className="flex items-center gap-3">
          <Info size={18} className="text-primary" />
          {t.profile.aboutApp}
        </span>
        <ChevronDown
          size={20}
          className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.profile.booksCount}</span>
              <span className="text-sm font-semibold text-foreground">{allBooksCount} ta</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.profile.usersCount}</span>
              <span className="text-sm font-semibold text-foreground">{totalUsers} nafar</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.profile.authorsCount}</span>
              <span className="text-sm font-semibold text-foreground">{totalAuthors} nafar</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.profile.categoriesCount}</span>
              <span className="text-sm font-semibold text-foreground">{totalCategories} ta</span>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                {t.profile.appDescription}
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {t.profile.version} 1.0.0
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}