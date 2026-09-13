import crypto from "node:crypto";
import { env } from "@/lib/env";

/**
 * Parolni ko'rsatish funksiyasi uchun parolning AES-256-GCM shifrlangan
 * nusxasi saqlanadi. scrypt hash hech qachon ochilmaydi — bu nusxa faqat
 * ADMIN va REGISTRAR guard'idan o'tgan API orqali ochiladi.
 *
 * Format: v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
 * Kalit: APP_SECRET dan KDF (scrypt) orqali olinadi.
 */

const VERSION = "v1";

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (!cachedKey) {
    cachedKey = crypto.scryptSync(env.appSecret, "mbsi-pw-enc-salt", 32);
  }
  return cachedKey;
}

/** Parolni shifrlash. DB'ga faqat shifrlangan matn yoziladi. */
export function encryptPassword(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

/** Shifrlangan parolni ochish. Noto'g'ri/kalit mos kelmasa null. */
export function decryptPassword(packed: string | null | undefined): string | null {
  if (!packed) return null;
  const parts = packed.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) return null;
  try {
    const [, ivHex, tagHex, dataHex] = parts;
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      getKey(),
      Buffer.from(ivHex, "hex")
    );
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataHex, "hex")),
      decipher.final(),
    ]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}
