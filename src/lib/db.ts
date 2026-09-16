import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// ─── Connection pooling ─────────────────────────────────────
// Serverless (Neon/Vercel) databases have a limited connection pool.
// We append `connection_limit` + `pool_timeout` to the Postgres URL
// so Prisma never exhausts the pool with ~600 concurrent users.
// PgBouncer/Neon pooler handles connection reuse; these params cap
// how many simultaneous connections Prisma keeps open.
//
// Override with PRISMA_CONNECTION_LIMIT / PRISMA_POOL_TIMEOUT.

function buildDbUrl(rawUrl: string): string {
  if (!rawUrl.startsWith("postgres")) return rawUrl;
  const sep = rawUrl.includes("?") ? "&" : "?";
  return `${rawUrl}${sep}connection_limit=${env.dbConnectionLimit}&pool_timeout=${env.dbPoolTimeout}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: buildDbUrl(env.dbUrl) } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}