import { route, json } from "@/lib/server/handler";
import { requireAnyRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";
import { decryptPassword } from "@/lib/server/password-crypto";
import type { UserRole } from "@/types";

/**
 * GET /api/admin/students/credentials?ids=a,b,c
 * O'quvchilarning login va (shifrdan ochilgan) parollarini qaytaradi.
 *
 * RUXSAT: faqat ADMIN va REGISTRAR (o'quvchi manageri). Boshqa hech kim —
 * BOOK_MANAGER, TEACHER, STUDENT — parollarni ko'ra olmaydi.
 */
const ALLOWED: UserRole[] = ["ADMIN", "REGISTRAR"];

export const GET = route(async (req) => {
  const viewer = await requireAnyRole(ALLOWED);
  if (!viewer) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  }

  const idsParam = req.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100);

  if (ids.length === 0) {
    throw new ApiError(ERROR_CODES.VALIDATION, "ids kerak", 400);
  }

  const users = await prisma.user.findMany({
    where: { id: { in: ids }, role: "STUDENT" },
    select: {
      id: true,
      name: true,
      username: true,
      passwordEnc: true,
    },
  });

  const items = users.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    password: decryptPassword(u.passwordEnc),
  }));

  return json({ success: true, data: items });
});
