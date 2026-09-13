import { route } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";

// GET /api/admin/students/pending — tasdiqlanmagan arizalar ro'yxati
export const GET = route(async () => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const items = await prisma.pendingStudent.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      login: true,
      email: true,
      phone: true,
      group: true,
      age: true,
      gender: true,
      address: true,
      parentContact: true,
      healthNote: true,
      about: true,
      avatarUrl: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      submittedBy: { select: { id: true, name: true } },
    },
  });
  return success(items);
});
