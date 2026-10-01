#!/usr/bin/env node
// Demo login accounts — barcha rollar uchun (parol: demo123)
import fs from "node:fs";
import path from "node:path";

// Load .env so APP_SECRET is available to password-crypto before lib import
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"(.*)"\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    else {
      const m2 = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m2 && process.env[m2[1]] === undefined) process.env[m2[1]] = m2[2];
    }
  }
}

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/server/password";
import { encryptPassword } from "../src/lib/server/password-crypto";

const prisma = new PrismaClient();

// Find-or-create account by username; keep existing role unless specified.
const DEMO_PASSWORD = "demo123";

const DEMO_ACCOUNTS: Array<{
  username: string;
  name: string;
  role: string;
  group?: string;
  teacherSubject?: string;
  staffPosition?: string;
}> = [
  { username: "admin", name: "Demo Admin", role: "ADMIN", staffPosition: "Administrator" },
  { username: "teacher", name: "Demo O'qituvchi", role: "TEACHER", teacherSubject: "Informatika" },
  { username: "student", name: "Demo O'quvchi", role: "STUDENT", group: "7-A" },
  { username: "bookmanager", name: "Demo Kitob menejeri", role: "BOOK_MANAGER", staffPosition: "Kutubxonachi" },
  { username: "registrar", name: "Demo Ro'yxatga oluvchi", role: "REGISTRAR", staffPosition: "Boshqa xodim" },
];

async function main() {
  const hash = hashPassword(DEMO_PASSWORD);
  const enc = encryptPassword(DEMO_PASSWORD);

  let created = 0;
  let updated = 0;

  for (const acc of DEMO_ACCOUNTS) {
    const existing = await prisma.user.findUnique({
      where: { username: acc.username },
    });
    if (existing) {
      await prisma.user.update({
        where: { username: acc.username },
        data: {
          passwordHash: hash,
          passwordEnc: enc,
          isActive: true,
          role: existing.role,
          name: existing.name,
        },
      });
      updated++;
      console.log(`  ♻️  ${acc.username} parol yangilandi -> demo123 (${existing.role})`);
    } else {
      await prisma.user.create({
        data: {
          username: acc.username,
          name: acc.name,
          role: acc.role,
          passwordHash: hash,
          passwordEnc: enc,
          isActive: true,
          group: acc.group,
          teacherSubject: acc.teacherSubject,
          staffPosition: acc.staffPosition,
        },
      });
      created++;
      console.log(`  ✅ ${acc.username} yaratildi (${acc.role})`);
    }
  }

  console.log(`\n✅ Demo akkauntlar tayyor: yaratilgan=${created}, yangilangan=${updated}`);
  console.log(`   🔑 Username/parol: admin · teacher · student · bookmanager · registrar / demo123`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());