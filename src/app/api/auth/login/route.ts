import { route, json, readJson } from "@/lib/server/handler";
import { requireUser, setSessionCookie, clearSessionCookie } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { ERROR_CODES, ApiError } from "@/lib/server/errors";
import type { User } from "@/types";

function toUser(u: {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: u.id,
    name: u.name,
    role: u.role as User["role"],
    avatar: u.avatar ?? undefined,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

export const POST = route(async (req) => {
  const body = await readJson<{ role: string }>(req);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      { success: false, error: { code: ERROR_CODES.VALIDATION, message: "Noto'g'ri rol" } },
      400
    );
  }
  const user = await prisma.user.findFirst({
    where: { role: parsed.data.role, isActive: true },
    orderBy: { createdAt: "asc" },
  });
  if (!user) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, "Foydalanuvchi topilmadi", 404);
  }
  const res = json({ success: true, data: toUser(user) });
  setSessionCookie(res, user.id);
  return res;
});

export const DELETE = route(async () => {
  const res = json({ success: true, data: null });
  clearSessionCookie(res);
  return res;
});
