// ============================================================
// MBSI Library — Roles & Status Seed (one-off maintenance)
// ============================================================
// - Ensures demo ADMIN / TEACHER / STUDENT / BOOK_MANAGER / REGISTRAR
//   accounts exist so every panel can be tested in demo mode.
// - Backfills book.status from isPublished (ACTIVE | DRAFT).
// - Deletes demo/placeholder books (book-1 … book-50) but keeps
//   real content (the "Ali va uning sarguzashtlari" demo reader).
// Run: node prisma/roles-seed.mjs
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROLE_USERS = [
  { id: "user-8", name: "Alisher Navoiy", role: "ADMIN", avatar: "/avatars/admin-1.svg" },
  { id: "user-6", name: "Dilshod Mirzayev", role: "TEACHER", avatar: "/avatars/teacher-1.svg" },
  { id: "user-1", name: "Muhammadamin Toshtemirov", role: "STUDENT", avatar: "/avatars/student-1.svg" },
  { id: "manager-1", name: "Zilola Rahimova", role: "BOOK_MANAGER", avatar: null },
  { id: "registrar-1", name: "Sanjar Tolibov", role: "REGISTRAR", avatar: null },
];

async function main() {
  // 1. Demo accounts for every panel role
  for (const u of ROLE_USERS) {
    await prisma.user.upsert({
      where: { id: u.id },
      create: { id: u.id, name: u.name, role: u.role, avatar: u.avatar, isActive: true },
      update: { name: u.name, role: u.role, avatar: u.avatar },
    });
  }
  console.log(`✅ ${ROLE_USERS.length} role accounts ready`);

  // 2. Backfill status from isPublished for existing rows
  const r1 = await prisma.book.updateMany({
    where: { isPublished: true, status: "ACTIVE" },
    data: { status: "ACTIVE" },
  });
  const r2 = await prisma.book.updateMany({
    where: { isPublished: false, status: "ACTIVE" },
    data: { status: "DRAFT" },
  });
  console.log(`✅ book.status backfilled (${r1.count} active, ${r2.count} → draft)`);

  // 3. Remove demo placeholder books (book-1 … book-50), keep real content
  const demoIds = Array.from({ length: 50 }, (_, i) => `book-${i + 1}`);
  const deleted = await prisma.book.deleteMany({
    where: { id: { in: demoIds } },
  });
  console.log(`🧹 ${deleted.count} demo books removed`);

  // 4. Cleanup: hide/remove any leftover placeholder-named books
  const placeholders = await prisma.book.findMany({
    where: {
      OR: [
        { title: { contains: "lorem ipsum", mode: "insensitive" } },
        { title: { contains: "test kitob", mode: "insensitive" } },
        { title: { contains: "sample book", mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
  for (const b of placeholders) {
    await prisma.book.delete({ where: { id: b.id } });
  }
  if (placeholders.length) console.log(`🧹 ${placeholders.length} placeholder books removed`);

  console.log("\n🎉 Done!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
