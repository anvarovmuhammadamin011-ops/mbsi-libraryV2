"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Heart, CheckCircle2, Star } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";

export type LibraryBook = {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  authorName: string | null;
};

export type ReadingItem = {
  id: string;
  progress: number;
  currentPage: number;
  book: LibraryBook;
};

export type SavedItem = {
  id: string;
  book: LibraryBook;
};

export type FinishedItem = {
  id: string;
  progress: number;
  book: LibraryBook;
};

type TabId = "reading" | "saved" | "finished";

function Cover({ book }: { book: LibraryBook }) {
  return (
    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-muted dark:bg-[#0E1629]">
      {book.coverUrl ? (
        <Image
          src={book.coverUrl}
          alt={book.title}
          fill
          className="object-cover"
          sizes="56px"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted dark:bg-[#0E1629] text-muted-foreground">
          <BookOpen size={16} />
        </div>
      )}
    </div>
  );
}

function ReadingRow({ item, t }: { item: ReadingItem; t: any }) {
  const pct = Math.round(item.progress);
  return (
    <Link
      href={`/reader/${item.book.slug}`}
      className="flex gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/50"
    >
      <Cover book={item.book} />
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
          {item.book.title}
        </p>
        {item.book.authorName && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.book.authorName}
          </p>
        )}
        <div className="mt-2">
          <p className="text-xs text-muted-foreground">{pct}% {t.library.continueReading}</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted dark:bg-white/10">
            <div
              className="h-full rounded-full bg-primary transition-all dark:shadow-[0_0_6px_rgba(96,165,250,0.4)]"
              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function SavedRow({ item }: { item: SavedItem }) {
  return (
    <Link
      href={`/books/${item.book.slug}`}
      className="flex gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/50"
    >
      <Cover book={item.book} />
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
          {item.book.title}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          {item.book.authorName && (
            <span className="truncate text-xs text-muted-foreground">
              {item.book.authorName}
            </span>
          )}
          <Star size={12} className="shrink-0 fill-yellow-400 text-yellow-400" />
        </div>
      </div>
    </Link>
  );
}

function FinishedRow({ item, t }: { item: FinishedItem; t: any }) {
  return (
    <Link
      href={`/books/${item.book.slug}`}
      className="flex gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/50"
    >
      <Cover book={item.book} />
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
          {item.book.title}
        </p>
        {item.book.authorName && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.book.authorName}
          </p>
        )}
        <div className="mt-2 flex items-center gap-1.5">
          <CheckCircle2 size={14} className="shrink-0 text-green-600" />
          <span className="text-xs font-medium text-green-600">100% · {t.library.finished}</span>
        </div>
      </div>
    </Link>
  );
}

function Empty({
  icon,
  title,
  description,
  t,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  t: any;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
      <Link
        href="/books"
        className="mt-4 inline-flex h-9 items-center justify-center rounded-full border border-border bg-card px-5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
      >
        {t.library.browseBooks}
      </Link>
    </div>
  );
}

export function LibraryTabs({
  reading,
  saved,
  finished,
}: {
  reading: ReadingItem[];
  saved: SavedItem[];
  finished: FinishedItem[];
}) {
  const { t } = useLanguage();
  const [active, setActive] = useState<TabId>("reading");

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "reading", label: t.library.reading, icon: <BookOpen size={14} /> },
    { id: "saved", label: t.library.saved, icon: <Heart size={14} /> },
    { id: "finished", label: t.library.finished, icon: <CheckCircle2 size={14} /> },
  ];

  return (
    <div className="space-y-4">
      {/* Pill tabs with icons */}
      <div className="inline-flex gap-1 rounded-full bg-muted p-1">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={
                isActive
                  ? "rounded-full bg-primary px-5 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors flex items-center gap-1.5"
                  : "rounded-full px-5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              }
            >
              <span className="shrink-0">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {active === "reading" && (
          <div className="space-y-3">
            {reading.length === 0 ? (
              <Empty
                icon={<BookOpen size={20} />}
                title={t.library.noBooksInProgress}
                description={t.library.noBooksInProgressSub}
                t={t}
              />
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground">{t.library.continueReading}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reading.map((item) => (
                    <ReadingRow key={item.id} item={item} t={t} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {active === "saved" && (
          <div className="space-y-3">
            {saved.length === 0 ? (
              <Empty
                icon={<Heart size={20} />}
                title={t.library.noSavedBooks}
                description={t.library.noSavedBooksSub}
                t={t}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {saved.map((item) => (
                  <SavedRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}

        {active === "finished" && (
          <div className="space-y-3">
            {finished.length === 0 ? (
              <Empty
                icon={<CheckCircle2 size={20} />}
                title={t.library.noFinishedBooks}
                description={t.library.noFinishedBooksSub}
                t={t}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {finished.map((item) => (
                  <FinishedRow key={item.id} item={item} t={t} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
