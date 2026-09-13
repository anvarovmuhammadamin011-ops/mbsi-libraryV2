import { route } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import {
  ApiError,
  ERROR_CODES,
  success,
} from "@/lib/server/errors";
import {
  getManagedUserDetail,
  updateManagedUser,
} from "@/lib/server/users";

export const GET = route(async (_req, ctx) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const { id } = await ctx.params;
  const detail = await getManagedUserDetail(id);
  return success(detail);
});

export const PATCH = route(async (req, ctx) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const { id } = await ctx.params;
  const body = await req.json();

  const patch: Parameters<typeof updateManagedUser>[1] = {};
  for (const f of [
    "name",
    "email",
    "phone",
    "avatar",
    "group",
    "gender",
    "address",
    "parentContact",
    "about",
    "staffPosition",
    "teacherSubject",
    "studentId",
    "staffId",
  ] as const) {
    if (body[f] !== undefined) patch[f] = body[f];
  }
  if (body.age !== undefined) patch.age = body.age === "" ? null : Number(body.age);
  if (body.birthDate !== undefined) patch.birthDate = body.birthDate === "" ? null : body.birthDate;
  if (body.staffPosition !== undefined) patch.staffPosition = body.staffPosition;
  if (body.role !== undefined) patch.role = body.role;
  if (body.isActive !== undefined) patch.isActive = Boolean(body.isActive);

  const u = await updateManagedUser(id, patch, admin.id);
  return success({
    id: u.id,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    avatar: u.avatar ?? undefined,
    updatedAt: u.updatedAt.toISOString(),
  });
});

export const DELETE = route(async (_req, ctx) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const { id } = await ctx.params;
  if (id === admin.id) {
    throw new ApiError(
      ERROR_CODES.VALIDATION,
      "O'zingizni o'chira olmaysiz",
      400
    );
  }
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, "Foydalanuvchi topilmadi", 404);
  }
  await prisma.user.delete({ where: { id } });
  return success({ ok: true });
});