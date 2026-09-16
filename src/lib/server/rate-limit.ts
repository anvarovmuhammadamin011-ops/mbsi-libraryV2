// ─── Fixed-window rate limiter ──────────────────────────────
// Edge-safe (requires no Node.js APIs, just a Map). Used in the
// API proxy/middleware to protect every /api endpoint from
// brute-force and abuse. Per-instance in serverless (resets on
// cold start) — an acceptable baseline; pair with external
// WAF/edge limits in production.

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSec: number;
  remaining: number;
};

type Entry = { count: number; resetAt: number };

export class FixedWindowLimiter {
  private store = new Map<string, Entry>();

  constructor(
    private readonly opts: { max: number; windowMs: number; now?: () => number }
  ) {}

  check(key: string): RateLimitResult {
    const now = (this.opts.now ?? Date.now)();
    const entry = this.store.get(key);
    if (!entry || now >= entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.opts.windowMs });
      return { allowed: true, retryAfterSec: 0, remaining: this.opts.max - 1 };
    }
    if (entry.count >= this.opts.max) {
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
        remaining: 0,
      };
    }
    entry.count += 1;
    return {
      allowed: true,
      retryAfterSec: 0,
      remaining: this.opts.max - entry.count,
    };
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Oxirgi xotira miqdorini cheklash (memory leak profile) —
// periodik tozalash: expired yozuvlarni yig'ishtirib tashlash.
export function sweepLimiter(limiter: FixedWindowLimiter, now?: number): void {
  const timestamp = now ?? Date.now();
  (limiter as unknown as { store: Map<string, Entry> }).store.forEach(
    (entry, key) => {
      if (timestamp >= entry.resetAt) {
        (limiter as unknown as { store: Map<string, Entry> }).store.delete(key);
      }
    }
  );
}