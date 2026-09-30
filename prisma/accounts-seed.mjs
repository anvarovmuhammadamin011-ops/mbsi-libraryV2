// ============================================================
// MBSI Library — Credential Accounts Seed
// ============================================================
// Creates/updates login accounts for each role. Passwords are
// NEVER hardcoded in the repo:
//
//   • If env var DEMO_PASSWORD_<USERNAME> is set (e.g.
//     DEMO_PASSWORD_ADMIN, DEMO_PASSWORD_STUDENT, ...) — that
//     password is used (hashed for login, encrypted copy for the
//     admin "show credentials" panel).
//   • Otherwise a secure random password is generated, printed to
//     the console ONCE, and you should move it to .env to keep the
//     account stable across re-seeds.
//
// Demo logins (usernames):
//   admin, student, teacher, staff, kitobmanager, oquvchimanager
//
// Run: node prisma/accounts-seed.mjs
// ============================================================

import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

// AES-256-GCM shifrlash — src/lib/server/password-crypto.ts bilan bir xil
// (APP_SECRET dan KDF orqali kalit olinadi).
function encryptPassword(plain) {
  const secret = process.env.APP_SECRET || "mbsi-library-insecure-dev-secret";
  const key = crypto.scryptSync(secret, "mbsi-pw-enc-salt", 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

const prisma = new PrismaClient();

// scrypt: salt:hash (hex) — login API bilan bir xil format
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// Env o'zgaruvchisidan parolni o'qiydi.
function envPassword(username) {
  const key = `DEMO_PASSWORD_${username.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
  const value = process.env[key];
  return value && value.length > 0 ? value : null;
}

const ACCOUNTS = [
  {
    id: "staff-admin",
    name: "Anvarov Muhammadamin",
    username: "admin",
    role: "ADMIN",
  },
  {
    id: "demo-student",
    name: "O'quvchi (Demo)",
    username: "student",
    role: "STUDENT",
  },
  {
    id: "demo-teacher",
    name: "O'qituvchi (Demo)",
    username: "teacher",
    role: "TEACHER",
  },
  {
    id: "demo-staff",
    name: "Hodim (Demo)",
    username: "staff",
    role: "STAFF",
  },
  {
    id: "staff-manager",
    name: "Toxtasinov Sadullo",
    username: "kitobmanager",
    role: "BOOK_MANAGER",
  },
  {
    id: "staff-registrar",
    name: "Anvarov Muhammadamin",
    username: "oquvchimanager",
    role: "REGISTRAR",
  },
];

async function main() {
  console.log("🔐 Seeding credential accounts...\n");
  console.log("   Parollar DEMO_PASSWORD_<USERNAME> env o'zgaruvchilaridan olinadi.\n");

  for (const a of ACCOUNTS) {
    const key = `DEMO_PASSWORD_${a.username.toUpperCase()}`;
    let password = envPassword(a.username);
    const existing = await prisma.user.findUnique({
      where: { username: a.username },
      select: { passwordHash: true, passwordEnc: true },
    });

    if (!password && existing?.passwordHash) {
      // Env yo'q, lekin akkaunt allaqachon mavjud — eski parolni Buzmaymiz.
      console.log(`   ℹ️  ${a.role.padEnd(14)} → ${a.username} (parol o'zgarmadi — ${key} env'da yo'q)`);
      await prisma.user.upsert({
        where: { username: a.username },
        create: {
          id: a.id,
          name: a.name,
          username: a.username,
          passwordHash: existing.passwordHash,
          passwordEnc: existing.passwordEnc,
          role: a.role,
          isActive: true,
        },
        update: {
          name: a.name,
          role: a.role,
          isActive: true,
        },
      });
      continue;
    }

    if (!password) {
      // Birinchi marta: tasodifiy parol yaratamiz va faqat bir marta chop etamiz.
      password = crypto.randomBytes(9).toString("base64url");
      console.log(`   🔑 ${a.role.padEnd(14)} → ${a.username}`);
      console.log(`      Yangi parol (birinchi marta): ${password}`);
      console.log(`      Uni saqlash uchun .env ga qo'shing: ${key}=${password}`);
      console.log("      (aks holda keyingi seed'da o'zgaradi)");
    } else {
      console.log(`   ✅ ${a.role.padEnd(14)} → ${a.username} (parol env'dan: ${key})`);
    }

    await prisma.user.upsert({
      where: { username: a.username },
      create: {
        id: a.id,
        name: a.name,
        username: a.username,
        passwordHash: hashPassword(password),
        passwordEnc: encryptPassword(password),
        role: a.role,
        isActive: true,
      },
      update: {
        name: a.name,
        passwordHash: hashPassword(password),
        passwordEnc: encryptPassword(password),
        role: a.role,
        isActive: true,
      },
    });
  }

  console.log("\n🎉 Credential accounts ready!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });