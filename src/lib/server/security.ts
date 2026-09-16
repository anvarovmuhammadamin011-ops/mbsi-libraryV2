// ─── Shared security constants (Edge-safe) ──────────────────
// Kept dependency-free so the API proxy/middleware (Edge runtime)
// can import these without pulling in Node.js-only modules.

export const SESSION_COOKIE = "mbsi_session";
export const CSRF_COOKIE = "mbsi_csrf";
export const CSRF_HEADER = "x-csrf-token";

export const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"] as const;
export const MUTATION_METHODS = [
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
] as const;

export function isMutationMethod(method: string): boolean {
  return (MUTATION_METHODS as readonly string[]).includes(
    method.toUpperCase()
  );
}