// Environment configuration (server-side only).
// Safe defaults let the app build without secrets; real values
// come from `.env`.

function str(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback;
}

export const env = {
  dbUrl: str("DATABASE_URL", "file:./dev.db"),
  isSqlite: str("DATABASE_URL", "file:./dev.db").includes("sqlite"),
  appSecret: str("APP_SECRET", "mbsi-library-insecure-dev-secret"),
  appUrl: str("APP_URL", "http://localhost:3000"),
  meiliHost: process.env.MEILI_HOST || "",
  meiliApiKey: process.env.MEILI_API_KEY || "",
  storageDriver: str("STORAGE_DRIVER", "local"),
  s3: {
    bucket: process.env.S3_BUCKET || "",
    region: process.env.S3_REGION || "",
    endpoint: process.env.S3_ENDPOINT || "",
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || "",
  },
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || "120"),
  isProd: process.env.NODE_ENV === "production",
};

export const SESSION_COOKIE = "mbsi_session";
export const ROLES = ["STUDENT", "TEACHER", "ADMIN"] as const;
export type AppRole = (typeof ROLES)[number];
