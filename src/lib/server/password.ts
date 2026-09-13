import crypto from "node:crypto";

/**
 * Parolni scrypt bilan hashlaymiz: `salt:hash` (hex).
 * Login API (src/app/api/auth/login/route.ts) bilan bir xil format.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Tasodifiy o'qishga qulay parol yaratamiz (masalan: "Kf3m-P9xq").
 * chalkash harflar (0/O, 1/l/I) ishlatilmaydi.
 */
export function generatePassword(length = 10): string {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
  let out = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  // o'qishni osonlashtirish uchun o'rtasiga tire qo'yamiz
  return `${out.slice(0, 5)}-${out.slice(5)}`;
}
