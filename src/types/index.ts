// ============================================================
// MBSI Library — Core Type Definitions
// ============================================================

// ─── Roles ──────────────────────────────────────────────────
// Asosiy ikki guruh: O'quvchi va Xodim. Xodimlar ichida role orqali:
// O'qituvchi, Direktor, Administrator, Kutubxonachi, Menejer, Boshqa xodim
export const ROLES = {
  STUDENT: "STUDENT",
  TEACHER: "TEACHER",
  ADMIN: "ADMIN",
  BOOK_MANAGER: "BOOK_MANAGER",
  REGISTRAR: "REGISTRAR",
  STAFF: "STAFF",
} as const;

// Staff positions (tegishli lavozim)
export const STAFF_POSITIONS = {
  DIRECTOR: "Direktor",
  ADMINISTRATOR: "Administrator",
  LIBRARIAN: "Kutubxonachi",
  MANAGER: "Menejer",
  OTHER: "Boshqa xodim",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export type StaffPosition =
  (typeof STAFF_POSITIONS)[keyof typeof STAFF_POSITIONS];

export const STAFF_POSITION_VALUES: StaffPosition[] = [
  "Direktor",
  "Administrator",
  "Kutubxonachi",
  "Menejer",
  "Boshqa xodim",
];

export const ROLE_LABELS: Record<UserRole | StaffPosition, string> = {
  STUDENT: "O'quvchi",
  TEACHER: "O'qituvchi",
  ADMIN: "Administrator",
  BOOK_MANAGER: "Kitob menejeri",
  REGISTRAR: "O'quvchi qo'shuvchi",
  STAFF: "Boshqa xodim",
  // Staff positions
  Direktor: "Direktor",
  Administrator: "Administrator",
  Kutubxonachi: "Kutubxonachi",
  Menejer: "Menejer",
  "Boshqa xodim": "Boshqa xodim",
};

export const ROLE_ICONS: Record<UserRole, string> = {
  STUDENT: "👨‍🎓",
  TEACHER: "👨‍🏫",
  ADMIN: "🛠",
  BOOK_MANAGER: "📚",
  REGISTRAR: "📝",
  STAFF: "💼",
};

export const LOGIN_ROLES = [
  "STUDENT",
  "TEACHER",
  "ADMIN",
  "BOOK_MANAGER",
  "REGISTRAR",
  "STAFF",
] as const satisfies readonly UserRole[];

// "Foydalanuvchi turi" dropdown (yangi foydalanuvchi qo'shish formasi)
export const USER_TYPE_OPTIONS = [
  { value: "STUDENT", label: "O'quvchi" },
  { value: "TEACHER", label: "O'qituvchi" },
  { value: "DIRECTOR", label: "Direktor" },
  { value: "ADMIN", label: "Administrator" },
  { value: "STAFF", label: "Xodim" },
] as const;

export type UserTypeChoice = (typeof USER_TYPE_OPTIONS)[number]["value"];

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
  username?: string;
  role: UserRole;
  avatar?: string;
  email?: string;
  phone?: string;
  group?: string;
  age?: number;
  gender?: string;
  address?: string;
  // ── Xodim uchun ──
  staffPosition?: string; // Direktor, Administrator, Kutubxonachi, Menejer, Boshqa xodim
  teacherSubject?: string; // O'qituvchi uchun fan/yo'nalish
  // ── Identifikatsiya ──
  studentId?: string; // O'quvchi ID
  staffId?: string; // Xodim ID
  birthDate?: string; // Tug'ilgan sana
  lastLoginAt?: string; // Oxirgi tizimga kirish
  // ── Global ──
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

// ─── Admin: battle / gamification ───────────────────────────
export interface BattleTeamStats {
  team: "STUDENT" | "TEACHER";
  score: number;
  booksStarted: number;
  booksCompleted: number;
  activeUsers: number;
  pagesRead: number;
  readingSeconds: number;
  sessions: number;
  topUser: UserBrief | null;
}

export interface BattleLeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  role: UserRole;
  group?: string | null;
  position?: string | null;
  avatar?: string | null;
  booksStarted: number;
  booksCompleted: number;
  pagesRead: number;
  readingSeconds: number;
  validSessions: number;
  points: number;
}

export interface QuizTeamAgg {
  student: BattleTeamStats;
  teacher: BattleTeamStats;
  winner: "STUDENT" | "TEACHER" | "TIE";
  leaderboard: BattleLeaderboardEntry[];
}

export type UserBrief = {
  id: string;
  name: string;
  role: string;
  group?: string | null;
  staffPosition?: string | null;
  avatar?: string | null;
};

// ─── System settings ────────────────────────────────────────
export interface SystemSettings {
  /** Faollik hisoblash: "haqiqiy o'qish" deb hisoblash uchun minimal mezonlar */
  minPagesPerRead: number;
  minSecondsPerRead: number;
  /** Battle ochko qoidalari (haqiqiy o'qish faoliyatiga asoslangan) */
  battleStartPoints: number;
  battleProgressPoints: number;
  battleCompletePoints: number;
  /** Permission: STAFF roli maxsus panelga kira oladimi */
  staffCanAccessApp: boolean;
  maxActiveBooks: number;
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