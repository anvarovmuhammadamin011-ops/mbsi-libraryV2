import { route } from "@/lib/server/handler";
import { requireRegistrar } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";

// GET /api/registrar/requests — REGISTRAR o'z yuborgan arizalarini ko'radi
export const GET = route(async () => {
  const user = await requireRegistrar();
  const items = await prisma.pendingStudent.findMany({
    where: { submittedById: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return success(items);
});
