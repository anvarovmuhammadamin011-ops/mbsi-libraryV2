import { route, json } from "@/lib/server/handler";
import { requireRegistrar } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";
import { decryptPassword } from "@/lib/server/password-crypto";

/**
 * GET /api/registrar/requests/[id]/credentials
 * REGISTRAR o'z yuborgan ARIZASI orqali qo'shilgan o'quvchining login va
 * parolini ko'radi. Faqat o'z arizalari uchun — boshqalarni emas.
 * ADMIN ham bu endpointdan foydalana oladi (requireRegistrar ikkalasiga ruxsat beradi).
 */
export const GET = route(async (req, ctx) => {
  const viewer = await requireRegistrar();
  const { id } = await ctx.params;

  // Ariza shu registratorga tegishliligid tekshiramiz
  const pending = await prisma.pendingStudent.findUnique({
    where: { id },
    select: {
      submittedById: true,
      status: true,
      login: true,
      studentId: true,
    },
  });

  if (!pending) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, "Ariza topilmadi", 404);
  }
  if (viewer.role === "REGISTRAR" && pending.submittedById !== viewer.id) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  }
  if (pending.status !== "APPROVED" || !pending.studentId) {
    throw new ApiError(
      ERROR_CODES.VALIDATION,
      "Ariza hali tasdiqlanmagan — parol mavjud emas",
      400
    );
  }

  const student = await prisma.user.findUnique({
    where: { id: pending.studentId },
    select: {
      id: true,
      name: true,
      username: true,
      passwordEnc: true,
    },
  });

  if (!student) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, "O'quvchi topilmadi", 404);
  }

  return json({
    success: true,
    data: {
      id: student.id,
      name: student.name,
      username: student.username,
      password: decryptPassword(student.passwordEnc),
    },
  });
});
