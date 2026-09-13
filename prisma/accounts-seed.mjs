// ============================================================
// MBSI Library — Credential Accounts Seed
// ============================================================
// Creates/updates the 3 staff login accounts:
//   1. Admin            — login: admin         parol: anvarovmuhammadamin021120111
//   2. Kitob menejeri   — login: kitobmanager  parol: kitobmenegermbsi
//   3. O'quvchi qo'shuvchi — login: oquvchimanager parol: oquvchimanagermbsi
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

const ACCOUNTS = [
  {
    id: "staff-admin",
    name: "Anvarov Muhammadamin",
    username: "admin",
    password: "anvarovmuhammadamin021120111",
    role: "ADMIN",
  },
  {
    id: "staff-manager",
    name: "Toxtasinov Sadullo",
    username: "kitobmanager",
    password: "kitobmenegermbsi",
    role: "BOOK_MANAGER",
  },
  {
    id: "staff-registrar",
    name: "Anvarov Muhammadamin",
    nameNote: "O'quvchi qo'shuvchi xodim",
    username: "oquvchimanager",
    password: "oquvchimanagermbsi",
    role: "REGISTRAR",
  },
];

async function main() {
  console.log("🔐 Seeding credential accounts...\n");

  for (const a of ACCOUNTS) {
    await prisma.user.upsert({
      where: { username: a.username },
      create: {
        id: a.id,
        name: a.name,
        username: a.username,
        passwordHash: hashPassword(a.password),
        passwordEnc: encryptPassword(a.password),
        role: a.role,
        isActive: true,
      },
      update: {
        name: a.name,
        passwordHash: hashPassword(a.password),
        passwordEnc: encryptPassword(a.password),
        role: a.role,
        isActive: true,
      },
    });
    console.log(`   ✅ ${a.role.padEnd(14)} → ${a.username} (${a.name})`);
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
