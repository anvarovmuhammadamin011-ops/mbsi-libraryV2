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
    include: {
      submittedBy: { select: { id: true, name: true } },
    },
  });
  return success(items);
});
