// ============================================================
// MBSI Library — Library Store (Demo)
// ============================================================

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Book,
  ReadingProgress,
  Bookmark,
  Favorite,
  Rating,
} from "@/types";
import { MAX_ACTIVE_BOOKS } from "@/types";
import {
  DEMO_BOOKS,
  DEMO_READING_PROGRESS,
  DEMO_BOOKMARKS,
  DEMO_FAVORITES,
  DEMO_RATINGS,
} from "@/lib/demo-data";

interface LibraryState {
  // Data
  books: Book[];
  readingProgress: ReadingProgress[];
  bookmarks: Bookmark[];
  favorites: Favorite[];
  ratings: Rating[];

  // Book actions
  getBook: (id: string) => Book | undefined;
  searchBooks: (query: string) => Book[];
  getBooksByCategory: (categoryId: string) => Book[];
  getBooksByLanguage: (language: string) => Book[];
  getPublishedBooks: () => Book[];

  // Reading progress
  getActiveBooks: (userId: string) => ReadingProgress[];
  getActiveBookCount: (userId: string) => number;
  canStartNewBook: (userId: string) => boolean;
  startReading: (userId: string, bookId: string) => ReadingProgress | null;
  updateProgress: (userId: string, bookId: string, page: number) => void;
  getProgress: (userId: string, bookId: string) => ReadingProgress | undefined;

  // Bookmarks
  addBookmark: (userId: string, bookId: string, page: number) => void;
  removeBookmark: (id: string) => void;
  getUserBookmarks: (userId: string) => Bookmark[];
  hasBookmark: (userId: string, bookId: string, page: number) => boolean;

  // Favorites
  addFavorite: (userId: string, bookId: string) => void;
  removeFavorite: (userId: string, bookId: string) => void;
  toggleFavorite: (userId: string, bookId: string) => void;
  getUserFavorites: (userId: string) => Favorite[];
  isFavorite: (userId: string, bookId: string) => boolean;

  // Ratings
  addRating: (userId: string, bookId: string, rating: number) => void;
  getUserRating: (userId: string, bookId: string) => Rating | undefined;
  getAverageRating: (bookId: string) => number;
}

function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      books: DEMO_BOOKS,
      readingProgress: DEMO_READING_PROGRESS,
      bookmarks: DEMO_BOOKMARKS,
      favorites: DEMO_FAVORITES,
      ratings: DEMO_RATINGS,

      // ─── Book Actions ────────────────────────────────────
      getBook: (id: string) => {
        return get().books.find((b) => b.id === id);
      },

      searchBooks: (query: string) => {
        const q = query.toLowerCase();
        return get().books.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.description.toLowerCase().includes(q)
        );
      },

      getBooksByCategory: (categoryId: string) => {
        return get().books.filter((b) => b.categoryId === categoryId);
      },

      getBooksByLanguage: (language: string) => {
        return get().books.filter((b) => b.language === language);
      },

      getPublishedBooks: () => {
        return get().books.filter((b) => b.isPublished);
      },

      // ─── Reading Progress ────────────────────────────────
      getActiveBooks: (userId: string) => {
        return get().readingProgress.filter(
          (rp) => rp.userId === userId && !rp.completedAt
        );
      },

      getActiveBookCount: (userId: string) => {
        return get().readingProgress.filter(
          (rp) => rp.userId === userId && !rp.completedAt
        ).length;
      },

      canStartNewBook: (userId: string) => {
        const activeCount = get().getActiveBookCount(userId);
        return activeCount < MAX_ACTIVE_BOOKS;
      },

      startReading: (userId: string, bookId: string) => {
        const state = get();

        // Check if already reading
        const existing = state.readingProgress.find(
          (rp) => rp.userId === userId && rp.bookId === bookId
        );
        if (existing) return existing;

        // Check limit
        if (!state.canStartNewBook(userId)) return null;

        const book = state.getBook(bookId);
        if (!book) return null;

        const newProgress: ReadingProgress = {
          id: generateId(),
          userId,
          bookId,
          currentPage: 1,
          totalPages: book.totalPages,
          progress: Math.round((1 / book.totalPages) * 100),
          startedAt: new Date().toISOString(),
          lastReadAt: new Date().toISOString(),
        };

        set({
          readingProgress: [...state.readingProgress, newProgress],
        });

        return newProgress;
      },

      updateProgress: (userId: string, bookId: string, page: number) => {
        const state = get();
        const book = state.getBook(bookId);
        if (!book) return;

        const progress = Math.round((page / book.totalPages) * 100);

        set({
          readingProgress: state.readingProgress.map((rp) =>
            rp.userId === userId && rp.bookId === bookId
              ? {
                  ...rp,
                  currentPage: page,
                  progress: Math.min(progress, 100),
                  lastReadAt: new Date().toISOString(),
                  completedAt:
                    progress >= 100 ? new Date().toISOString() : rp.completedAt,
                }
              : rp
          ),
        });
      },

      getProgress: (userId: string, bookId: string) => {
        return get().readingProgress.find(
          (rp) => rp.userId === userId && rp.bookId === bookId
        );
      },

      // ─── Bookmarks ───────────────────────────────────────
      addBookmark: (userId: string, bookId: string, page: number) => {
        const state = get();
        // Prevent duplicate
        const exists = state.bookmarks.some(
          (bm) => bm.userId === userId && bm.bookId === bookId && bm.page === page
        );
        if (exists) return;

        const newBookmark: Bookmark = {
          id: generateId(),
          userId,
          bookId,
          page,
          createdAt: new Date().toISOString(),
        };

        set({ bookmarks: [...state.bookmarks, newBookmark] });
      },

      removeBookmark: (id: string) => {
        set({
          bookmarks: get().bookmarks.filter((bm) => bm.id !== id),
        });
      },

      getUserBookmarks: (userId: string) => {
        return get().bookmarks.filter((bm) => bm.userId === userId);
      },

      hasBookmark: (userId: string, bookId: string, page: number) => {
        return get().bookmarks.some(
          (bm) => bm.userId === userId && bm.bookId === bookId && bm.page === page
        );
      },

      // ─── Favorites ───────────────────────────────────────
      addFavorite: (userId: string, bookId: string) => {
        const state = get();
        const exists = state.favorites.some(
          (f) => f.userId === userId && f.bookId === bookId
        );
        if (exists) return;

        const newFavorite: Favorite = {
          id: generateId(),
          userId,
          bookId,
          createdAt: new Date().toISOString(),
        };

        set({ favorites: [...state.favorites, newFavorite] });
      },

      removeFavorite: (userId: string, bookId: string) => {
        set({
          favorites: get().favorites.filter(
            (f) => !(f.userId === userId && f.bookId === bookId)
          ),
        });
      },

      toggleFavorite: (userId: string, bookId: string) => {
        const state = get();
        if (state.isFavorite(userId, bookId)) {
          state.removeFavorite(userId, bookId);
        } else {
          state.addFavorite(userId, bookId);
        }
      },

      getUserFavorites: (userId: string) => {
        return get().favorites.filter((f) => f.userId === userId);
      },

      isFavorite: (userId: string, bookId: string) => {
        return get().favorites.some(
          (f) => f.userId === userId && f.bookId === bookId
        );
      },

      // ─── Ratings ─────────────────────────────────────────
      addRating: (userId: string, bookId: string, rating: number) => {
        const state = get();
        const clampedRating = Math.max(1, Math.min(5, Math.round(rating)));

        const existing = state.ratings.find(
          (r) => r.userId === userId && r.bookId === bookId
        );

        if (existing) {
          set({
            ratings: state.ratings.map((r) =>
              r.userId === userId && r.bookId === bookId
                ? { ...r, rating: clampedRating, updatedAt: new Date().toISOString() }
                : r
            ),
          });
        } else {
          const newRating: Rating = {
            id: generateId(),
            userId,
            bookId,
            rating: clampedRating,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set({ ratings: [...state.ratings, newRating] });
        }
      },

      getUserRating: (userId: string, bookId: string) => {
        return get().ratings.find(
          (r) => r.userId === userId && r.bookId === bookId
        );
      },

      getAverageRating: (bookId: string) => {
        const bookRatings = get().ratings.filter((r) => r.bookId === bookId);
        if (bookRatings.length === 0) return 0;
        const sum = bookRatings.reduce((acc, r) => acc + r.rating, 0);
        return Math.round((sum / bookRatings.length) * 10) / 10;
      },
    }),
    {
      name: "mbsi-library",
    }
  )
);
