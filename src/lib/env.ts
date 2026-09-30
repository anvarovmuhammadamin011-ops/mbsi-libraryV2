// Environment configuration (server-side only).
// Safe defaults let the app build without secrets; real values
// come from `.env`.

function str(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback;
}

// Production uchun APP_SECRET majburiy — fail-fast (faqat runtime'da).
// Vercel'da Sensitive env qiymatlari build jarayoniga yuborilmaydi, shuning
// uchun `next build` davrida (NEXT_PHASE=phase-production-build) tekshiruvni
// o'tkazib yuboramiz — aks holda deploy build'da yiqiladi.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const appSecret = str("APP_SECRET", "");
if (
  process.env.NODE_ENV === "production" &&
  !isBuildPhase &&
  (!appSecret || appSecret.length < 32)
) {
  throw new Error(
    "❌ APP_SECRET production'da MAJBURIY va kamida 32 belgidan iborat bo'lishi kerak. " +
      "Uni .env faylida o'rnating (masalan: APP_SECRET=<uzun tasodifiy satr>). " +
      "Xuddi shu kalit davr mobaynida sessiya/CSRF imzolarini tekshiradi."
  );
}

export const env = {
  dbUrl: str("DATABASE_URL", "file:./dev.db"),
  isSqlite: str("DATABASE_URL", "file:./dev.db").includes("sqlite"),
  appSecret: appSecret || "mbsi-library-dev-only-not-for-production",
  appUrl: str("APP_URL", "http://localhost:3000"),
  meiliHost: process.env.MEILI_HOST || "",
  meiliApiKey: process.env.MEILI_API_KEY || "",
  storageDriver: str("STORAGE_DRIVER", "auto"),
  // Lokal diskda yo'q bo'lgan PDF kalitlari uchun zaxira manba.
  // Masalan: https://github.com/<owner>/<repo>/releases/download/pdfs-v1
  // (Vercel funksiyasi 4.5 MB dan katta javob bera olmaydi, shuning uchun
  //  bu URL dan stream qilinadi — ko'rish uchun /api/pdf/[id]).
  pdfPublicBase: str("PDF_PUBLIC_BASE", ""),
  s3: {
    bucket: process.env.S3_BUCKET || "",
    region: process.env.S3_REGION || "",
    endpoint: process.env.S3_ENDPOINT || "",
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || "",
  },
  dbConnectionLimit: Number(process.env.PRISMA_CONNECTION_LIMIT || "10"),
  dbPoolTimeout: Number(process.env.PRISMA_POOL_TIMEOUT || "30"),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || "0"),
  rateLimitEnabled:
    (process.env.RATE_LIMIT_ENABLED ?? "true").toLowerCase() === "true",
  rateLimitReadMax: Number(process.env.RATE_LIMIT_READ_MAX || "600"),
  rateLimitReadWindow: Number(process.env.RATE_LIMIT_READ_WINDOW_MS || "60000"),
  rateLimitMutationMax: Number(process.env.RATE_LIMIT_MUTATION_MAX || "120"),
  rateLimitMutationWindow: Number(
    process.env.RATE_LIMIT_MUTATION_WINDOW_MS || "60000"
  ),
  isProd: process.env.NODE_ENV === "production",
};

export const SESSION_COOKIE = "mbsi_session";
export const ROLES = [
  "STUDENT",
  "TEACHER",
  "ADMIN",
  "BOOK_MANAGER",
  "REGISTRAR",
] as const;

export const USER_TYPES = [
  { value: "STUDENT", label: "O'quvchi" },
  { value: "TEACHER", label: "O'qituvchi" },
  { value: "ADMIN", label: "Admin" },
  { value: "BOOK_MANAGER", label: "Kitob menejeri" },
  { value: "STAFF", label: "Boshqa xodim" },
] as const;
export type AppRole = (typeof ROLES)[number];
