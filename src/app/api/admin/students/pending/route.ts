import { route, readJson } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { pendingStudentSchema } from "@/lib/validation";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";

// GET /api/admin/students/pending — tasdiqlanmagan arizalar ro'yxati
export const GET = route(async () => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const items = await prisma.pendingStudent.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  return success(items);
});

// POST /api/admin/students/pending — yangi o'quvchi arizasi (forma)
export const POST = route(async (req) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const body = await readJson(req);
  const parsed = pendingStudentSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Ma'lumotlar noto'g'ri", 400);
  }
  const d = parsed.data;
  const item = await prisma.pendingStudent.create({
    data: {
      firstName: d.firstName.trim(),
      lastName: d.lastName.trim(),
      email: d.email?.trim() || null,
      phone: d.phone?.trim() || null,
      group: d.group.trim(),
      age: d.age,
      gender: d.gender ?? null,
      address: d.address?.trim() || null,
      parentContact: d.parentContact?.trim() || null,
      healthNote: d.healthNote?.trim() || null,
      about: d.about?.trim() || null,
    },
  });
  return success(item, 201);
});
