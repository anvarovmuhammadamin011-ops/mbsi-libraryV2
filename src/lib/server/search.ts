import { env } from "@/lib/env";
import type { BookRow } from "./books";

// meilisearch is an optional peer dependency — dynamically imported
// only when MEILI_HOST is configured. The cast below suppresses
// the TS error when the package is not installed locally.

// ─── Search abstraction ──────────────────────────────────────
// When MEILI_HOST is configured, Meilisearch is used for fast
// full-text search. Otherwise (and on any Meili failure) we fall
// back to database filtering handled in books.ts.
//
// `meilisearch` is imported dynamically so the dependency is only
// required when actually used (keeps install light for local dev).

const INDEX = "books";

interface IndexedBook {
  id: string;
  title: string;
  description: string;
  authorName: string;
  categoryName: string;
  language: string;
  categoryId: string;
  authorId: string;
  isPublished: boolean;
}

function toIndexed(book: BookRow): IndexedBook {
  return {
    id: book.id,
    title: book.title,
    description: book.description ?? "",
    authorName: book.author?.name ?? "",
    categoryName: book.category?.name ?? "",
    language: book.language,
    categoryId: book.categoryId,
    authorId: book.authorId,
    isPublished: book.isPublished,
  };
}

async function getClient() {
  if (!env.meiliHost) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = await import(/* webpackIgnore: true */ "meilisearch" as string);
    const MeiliSearch = (mod as any).MeiliSearch ?? (mod as any).default;
    return new MeiliSearch({
      host: env.meiliHost,
      apiKey: env.meiliApiKey || undefined,
    });
  } catch (e) {
    console.warn("[SEARCH] meilisearch package not installed; using DB fallback", e);
    return null;
  }
}

export async function ensureIndex(client: any) {
  if (!client) return;
  await client.createIndex(INDEX, { primaryKey: "id" }).catch(() => {});
  const index = client.index(INDEX);
  await index
    .updateSearchableAttributes([
      "title",
      "description",
      "authorName",
      "categoryName",
    ])
    .catch(() => {});
  await index
    .updateFilterableAttributes([
      "language",
      "categoryId",
      "authorId",
      "isPublished",
    ])
    .catch(() => {});
}

export async function indexBook(book: BookRow): Promise<void> {
  const client = await getClient();
  if (!client) return;
  await ensureIndex(client);
  await client.index(INDEX).addDocuments([toIndexed(book)]).catch((e: unknown) => {
    console.error("[SEARCH] index failed", e);
  });
}

export async function deleteBookIndex(id: string): Promise<void> {
  const client = await getClient();
  if (!client) return;
  await client.index(INDEX).deleteDocument(id).catch(() => {});
}

export async function reindexAll(): Promise<void> {
  const { prisma } = await import("@/lib/db");
  const client = await getClient();
  if (!client) return;
  await ensureIndex(client);
  const books = await prisma.book.findMany({
    include: { author: true, category: true },
  });
  await client.index(INDEX).addDocuments(books.map(toIndexed)).catch(() => {});
}

// Returns matching book ids, or null to signal "use DB fallback".
export async function searchBookIds(q: string): Promise<string[] | null> {
  const client = await getClient();
  if (!client) return null;
  try {
    const res = await client.index(INDEX).search(q, { limit: 200 });
    return res.hits.map((h: any) => h.id as string);
  } catch (e) {
    console.warn("[SEARCH] search failed; using DB fallback", e);
    return null;
  }
}
