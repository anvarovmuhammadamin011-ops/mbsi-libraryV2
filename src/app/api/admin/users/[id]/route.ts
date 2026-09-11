import { route } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";

export const PATCH = route(async (req, ctx) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const { id } = await ctx.params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.role) data.role = body.role;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  // O'quvchi profili maydonlari (Students seksiyasi — tahrirlash)
  for (const f of [
    "name",
    "email",
    "phone",
    "group",
    "age",
    "gender",
    "address",
    "parentContact",
    "healthNote",
    "about",
  ]) {
    if (body[f] !== undefined) data[f] = body[f] === "" ? null : body[f];
  }
  const u = await prisma.user.update({ where: { id }, data });
  return success({
    id: u.id,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    avatar: u.avatar ?? undefined,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  });
});

export const DELETE = route(async (req, ctx) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const { id } = await ctx.params;
  if (id === admin.id) {
    throw new ApiError(ERROR_CODES.VALIDATION, "O'zingizni o'chira olmaysiz", 400);
  }
  await prisma.user.delete({ where: { id } }).catch(() => {});
  return success({ ok: true });
});
