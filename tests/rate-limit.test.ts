import { describe, it, expect } from "vitest";
import { FixedWindowLimiter, sweepLimiter } from "@/lib/server/rate-limit";

describe("FixedWindowLimiter", () => {
  it("allows requests below the limit", () => {
    const limiter = new FixedWindowLimiter({ max: 3, windowMs: 60_000 });
    expect(limiter.check("ip:1").allowed).toBe(true);
    expect(limiter.check("ip:1").allowed).toBe(true);
    expect(limiter.check("ip:1").allowed).toBe(true);
  });

  it("blocks requests above the limit", () => {
    const limiter = new FixedWindowLimiter({ max: 2, windowMs: 60_000 });
    limiter.check("ip:1");
    limiter.check("ip:1");
    const third = limiter.check("ip:1");
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSec).toBeGreaterThan(0);
  });

  it("tracks separate keys independently", () => {
    const limiter = new FixedWindowLimiter({ max: 1, windowMs: 60_000 });
    expect(limiter.check("ip:1").allowed).toBe(true);
    expect(limiter.check("ip:1").allowed).toBe(false);
    expect(limiter.check("ip:2").allowed).toBe(true);
  });

  it("resets after the window elapses", () => {
    let now = 0;
    const limiter = new FixedWindowLimiter({
      max: 1,
      windowMs: 1_000,
      now: () => now,
    });
    expect(limiter.check("ip:1").allowed).toBe(true);
    now = 1_001;
    expect(limiter.check("ip:1").allowed).toBe(true);
  });

  it("reset(key) clears a single key", () => {
    const limiter = new FixedWindowLimiter({ max: 1, windowMs: 60_000 });
    limiter.check("ip:1");
    expect(limiter.check("ip:1").allowed).toBe(false);
    limiter.reset("ip:1");
    expect(limiter.check("ip:1").allowed).toBe(true);
  });

  it("sweepLimiter removes expired entries", () => {
    let now = 0;
    const limiter = new FixedWindowLimiter({
      max: 5,
      windowMs: 1_000,
      now: () => now,
    });
    limiter.check("a");
    limiter.check("b");
    expect((limiter as unknown as { store: Map<string, unknown> }).store.size).toBe(2);
    now = 2_000;
    sweepLimiter(limiter, now);
    expect((limiter as unknown as { store: Map<string, unknown> }).store.size).toBe(0);
  });
});