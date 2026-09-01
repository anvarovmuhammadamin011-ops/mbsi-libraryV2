import { route, json } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { getBallHistory, getUserBalls, MAX_BALLS } from "@/lib/server/balls";

export const GET = route(async (req) => {
  const user = await requireUser();

  const balls = await getUserBalls(user.id);
  const history = await getBallHistory(user.id, 50);

  return json({
    success: true,
    data: {
      balls,
      maxBalls: MAX_BALLS,
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
});
