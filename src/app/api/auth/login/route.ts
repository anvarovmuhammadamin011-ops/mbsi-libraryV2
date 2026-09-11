import { route, json, readJson } from "@/lib/server/handler";
import { setSessionCookie, clearSessionCookie } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { ERROR_CODES, ApiError } from "@/lib/server/errors";
import type { User } from "@/types";

const DEMO_NAMES: Record<string, string> = {
  STUDENT: "Muhammadamin Toshtemirov",
  TEACHER: "Dilshod Mirzayev",
  ADMIN: "Alisher Navoiy",
  BOOK_MANAGER: "Zilola Rahimova",
  REGISTRAR: "Sanjar Tolibov",
};

function toUser(u: {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  coins: number;
  balls: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: u.id,
    name: u.name,
    role: u.role as User["role"],
    avatar: u.avatar ?? undefined,
    coins: u.coins ?? 0,
    balls: u.balls ?? 0,
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
  let user = await prisma.user.findFirst({
    where: { role: parsed.data.role, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  // Demo rejim: rolda faol foydalanuvchi bo'lmasa — demo account yaratamiz,
  // shunda barcha panellar har doim tekshirilishi mumkin.
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: DEMO_NAMES[parsed.data.role] ?? "Demo foydalanuvchi",
        role: parsed.data.role,
        isActive: true,
      },
    });
  }

  const res = json({ success: true, data: toUser(user as any) });
  setSessionCookie(res, user.id);
  return res;
});

export const DELETE = route(async () => {
  const res = json({ success: true, data: null });
  clearSessionCookie(res);
  return res;
});
