// ============================================================
// MBSI Library — Core Type Definitions
// ============================================================

// ─── Roles ──────────────────────────────────────────────────
export const ROLES = {
  STUDENT: "STUDENT",
  TEACHER: "TEACHER",
  ADMIN: "ADMIN",
  BOOK_MANAGER: "BOOK_MANAGER",
  REGISTRAR: "REGISTRAR",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: "O'quvchi",
  TEACHER: "O'qituvchi",
  ADMIN: "Admin",
  BOOK_MANAGER: "Kitob menejeri",
  REGISTRAR: "O'quvchi qo'shuvchi",
};

export const ROLE_ICONS: Record<UserRole, string> = {
  STUDENT: "👨‍🎓",
  TEACHER: "👨‍🏫",
  ADMIN: "🛠",
  BOOK_MANAGER: "📚",
  REGISTRAR: "📝",
};

// Demo login uchun ruxsat etilgan rollar (har biriga kamida 1 ta demo account bor)
export const LOGIN_ROLES = [
  "STUDENT",
  "TEACHER",
  "ADMIN",
  "BOOK_MANAGER",
  "REGISTRAR",
] as const satisfies readonly UserRole[];

// Ushbu rolga tegishli bosh sahifa/panel URL'i
export function roleHome(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "BOOK_MANAGER":
      return "/manager";
    case "REGISTRAR":
      return "/registrar";
    default:
      return "/home";
  }
}

// ─── Languages ──────────────────────────────────────────────
export const LANGUAGES = {
  UZ: "O'zbek",
  RU: "Rus",
  EN: "English",
} as const;

export type Language = keyof typeof LANGUAGES;

// ─── User ───────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  coins?: number;
  balls?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Author ─────────────────────────────────────────────────
export interface Author {
  id: string;
  name: string;
  biography?: string;
  avatar?: string;
  createdAt: string;
}

// ─── Category ───────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
}

// ─── Book ───────────────────────────────────────────────────
export interface Book {
  id: string;
  title: string;
  slug?: string;
  description: string;
  coverUrl: string;
  pdfUrl: string;
  language: Language;
  totalPages: number;
  coinReward?: number;
  authorId: string;
  author?: Author;
  categoryId: string;
  category?: Category;
  isPublished: boolean;
  /** Kitob menejeri statusi: ACTIVE (ko'rinadi) | HIDDEN (yashirilgan) | DRAFT (qoralama) */
  status?: string;
  averageRating?: number;
  ratingCount?: number;
  readerCount?: number;
  totalReaders?: number;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Reading Progress ───────────────────────────────────────
export interface ReadingProgress {
  id: string;
  userId: string;
  bookId: string;
  book?: Book;
  currentPage: number;
  totalPages: number;
  progress: number; // 0-100
  startedAt: string;
  lastReadAt: string;
  completedAt?: string;
}

// ─── Reading Session ────────────────────────────────────────
export interface ReadingSession {
  id: string;
  userId: string;
  bookId: string;
  startPage: number;
  endPage: number;
  pagesRead: number;
  startedAt: string;
  endedAt: string;
  duration: number; // seconds
}

// ─── Bookmark ───────────────────────────────────────────────
export interface Bookmark {
  id: string;
  userId: string;
  bookId: string;
  book?: Book;
  page: number;
  note?: string;
  createdAt: string;
}

// ─── Favorite ───────────────────────────────────────────────
export interface Favorite {
  id: string;
  userId: string;
  bookId: string;
  book?: Book;
  createdAt: string;
}

// ─── Rating ─────────────────────────────────────────────────
export interface Rating {
  id: string;
  userId: string;
  bookId: string;
  rating: number; // 1-5
  createdAt: string;
  updatedAt: string;
}

// ─── Banner ─────────────────────────────────────────────────
export interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  link?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
}

// ─── Recommendation ─────────────────────────────────────────
export interface Recommendation {
  id: string;
  bookId: string;
  book?: Book;
  title: string;
  description?: string;
  order: number;
  isActive: boolean;
}

// ─── Audit Log ──────────────────────────────────────────────
export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── Statistics ─────────────────────────────────────────────
export interface UserStatistics {
  totalBooks: number;
  totalPages: number;
  readingTime: number; // minutes
  currentStreak: number;
  ranking: number;
  monthlyPages: number;
  monthlyBooks: number;
  monthlyReadingTime: number;
}

export interface PlatformStatistics {
  totalUsers: number;
  totalBooks: number;
  totalPagesRead: number;
  totalReadingSessions: number;
  activeStudents: number;
  activeTeachers: number;
  topReader?: User;
}

// ─── Ranking ────────────────────────────────────────────────
export interface RankingEntry {
  rank: number;
  userId: string;
  user?: User;
  totalPages: number;
  totalBooks: number;
  readingTime: number;
  streak: number;
  balls?: number;
}

// ─── Book Status (kitob menejeri) ───────────────────────────
export const BOOK_STATUSES = {
  ACTIVE: "ACTIVE", // o'quvchilar ko'ra va o'qiy oladi
  HIDDEN: "HIDDEN", // o'quvchilarga ko'rinmaydi
  DRAFT: "DRAFT", // hali tayyor emas
} as const;

export type BookStatus = (typeof BOOK_STATUSES)[keyof typeof BOOK_STATUSES];

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  ACTIVE: "Faol",
  HIDDEN: "Yashirilgan",
  DRAFT: "Qoralama",
};

// ─── Pending Student Request ────────────────────────────────
export interface PendingStudentRequest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  group?: string | null;
  age?: number | null;
  gender?: string | null;
  avatarUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedBy?: { id: string; name: string } | null;
  createdAt: string;
}

// ─── API Response ───────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Active Book Limit ──────────────────────────────────────
export const MAX_ACTIVE_BOOKS = 3;
