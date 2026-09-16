import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, generatePassword } from "@/lib/server/password";

describe("password helpers", () => {
  it("hashPassword produces salt:hash format", () => {
    const hash = hashPassword("TopSecret123!");
    expect(hash).toContain(":");
    const [salt, rest] = hash.split(":");
    expect(salt.length).toBe(32); // 16 bytes hex
    expect(rest.length).toBe(128); // 64 bytes hex
  });

  it("verifyPassword returns true for the correct password", () => {
    const hash = hashPassword("correct-password");
    expect(verifyPassword("correct-password", hash)).toBe(true);
  });

  it("verifyPassword returns false for a wrong password", () => {
    const hash = hashPassword("correct-password");
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("verifyPassword returns false for null/empty stored hash", () => {
    expect(verifyPassword("anything", null)).toBe(false);
    expect(verifyPassword("anything", "")).toBe(false);
  });

  it("generatePassword respects length and charset", () => {
    for (let i = 0; i < 20; i++) {
      const pwd = generatePassword(10);
      expect(pwd.replace("-", "").length).toBe(10);
      expect(pwd).toMatch(/^[2-9A-HJKMNP-Za-hjkmnp-z]{5}-[2-9A-HJKMNP-Za-hjkmnp-z]{5}$/);
    }
  });
});