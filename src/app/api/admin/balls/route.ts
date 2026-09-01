import { route, json, readJson } from "@/lib/server/handler";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { addBalls, takeBalls, setBalls, MAX_BALLS } from "@/lib/server/balls";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const GET = route(async (req) => {
  await requireAdmin();

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(ERROR_CODES.NOT_FOUND, "Foydalanuvchi topilmadi", 404);

    const { getBallHistory } = await import("@/lib/server/balls");
    const history = await getBallHistory(userId, 100);

    return json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          balls: (user as any).balls ?? 0,
        },
        history: history.map((h) => ({
          id: h.id,
          amount: h.amount,
          balance: h.balance,
          type: h.type,
          description: h.description,
          createdAt: h.createdAt.toISOString(),
        })),
      },
    });
  }

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      role: true,
      balls: true,
    },
    orderBy: { name: "asc" },
  });

  return json({
    success: true,
    data: {
      maxBalls: MAX_BALLS,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        balls: (u as any).balls ?? 0,
      })),
    },
  });
});

export const POST = route(async (req) => {
  const admin = await requireAdmin();
  const body = await readJson<{
    userId: string;
    action: "give" | "take" | "set";
    amount?: number;
    description?: string;
  }>(req);

  const { userId, action, amount, description } = body;

  if (!userId) throw new ApiError(ERROR_CODES.VALIDATION, "userId kiritilishi shart", 400);
  if (!action || !["give", "take", "set"].includes(action)) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri action (give/take/set)", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(ERROR_CODES.NOT_FOUND, "Foydalanuvchi topilmadi", 404);

  const adminNote = description || `Admin tomonidan: ${admin.name}`;

  let result;
  if (action === "give") {
    if (!amount || amount <= 0) throw new ApiError(ERROR_CODES.VALIDATION, "Amount musbat bo'lishi kerak", 400);
    result = await addBalls(userId, amount, "ADMIN_GIVE", adminNote, admin.id);
  } else if (action === "take") {
    if (!amount || amount <= 0) throw new ApiError(ERROR_CODES.VALIDATION, "Amount musbat bo'lishi kerak", 400);
    result = await takeBalls(userId, amount, "ADMIN_TAKE", adminNote, admin.id);
  } else {
    if (amount === undefined || amount === null) throw new ApiError(ERROR_CODES.VALIDATION, "Amount kiritilishi shart", 400);
    result = await setBalls(userId, amount, "ADMIN_GIVE", adminNote);
  }

  return json({
    success: true,
    data: {
      userId,
      newBalance: result.newBalance,
      action,
      amount,
    },
  });
});
