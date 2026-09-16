import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { signSession, verifySession } from "@/lib/server/auth";
import { generateCsrfToken, validateCsrfToken } from "@/lib/server/csrf";

// NOTE: auth.ts imports `cookies` from next/headers and instantiates
// PrismaClient — both are lazy, so pure functions (sign/verify) work in
// a Node test env without a running server or database.

describe("session tokens", () => {
  const USER_ID = "user_abc123";

  it("signSession produces a versioned token", () => {
    const token = signSession(USER_ID, 3);
    expect(token.startsWith(`${USER_ID}.v3.`)).toBe(true);
  });

  it("verifySession returns userId and version", () => {
    const token = signSession(USER_ID, 7);
    const info = verifySession(token);
    expect(info).toEqual({ userId: USER_ID, version: 7 });
  });

  it("verifySession rejects a tampered signature", () => {
    const token = signSession(USER_ID, 1);
    const [uid, ver, _sig] = token.split(".");
    const tampered = `${uid}.${ver}.${"0".repeat(_sig.length)}`;
    expect(verifySession(tampered)).toBeNull();
  });

  it("verifySession rejects a wrong user id", () => {
    const token = signSession(USER_ID, 1);
    const [, ver, sig] = token.split(".");
    expect(verifySession(`other_user.v${ver}.${sig}`)).toBeNull();
  });

  it("verifySession rejects malformed tokens", () => {
    expect(verifySession(undefined)).toBeNull();
    expect(verifySession("")).toBeNull();
    expect(verifySession("not-a-token")).toBeNull();
    expect(verifySession("a.v2.bad-sig.extra")).toBeNull();
  });
});

describe("csrf tokens", () => {
  it("generates a token bound to a session", () => {
    const token = generateCsrfToken("session-1");
    expect(validateCsrfToken(token, "session-1")).toBe(true);
  });

  it("rejects a token for a different session", () => {
    const token = generateCsrfToken("session-1");
    expect(validateCsrfToken(token, "session-2")).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const token = generateCsrfToken("session-1");
    const [payload, _sig] = token.split(".");
    const forged = `${payload}.${"0".repeat(_sig.length)}`;
    expect(validateCsrfToken(forged, "session-1")).toBe(false);
  });

  it("rejects empty or malformed tokens", () => {
    expect(validateCsrfToken("", "session-1")).toBe(false);
    expect(validateCsrfToken("no-dot", "session-1")).toBe(false);
    expect(validateCsrfToken("a.b.c", "session-1")).toBe(false);
  });
});