import { PrismaClient } from "@prisma/client";
import { verifyPassword } from "../src/lib/server/password";
const prisma = new PrismaClient();
async function main() {
  const names = ["student","teacher","bookmanager","registrar","admin"];
  for (const name of names) {
    const u = await prisma.user.findUnique({ where: { username: name } });
    if (!u) { console.log(name, "NOT FOUND"); continue; }
    const ok = verifyPassword("demo123", u.passwordHash);
    console.log(name, "role=" + u.role, "isActive=" + u.isActive, "passOk=" + ok, "hash=" + (u.passwordHash||"").slice(0,20));
  }
}
main().finally(() => prisma.$disconnect());
