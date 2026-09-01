import { route, json } from "@/lib/server/handler";
import { requireAdmin } from "@/lib/server/auth";
import { checkAndPenalizeExpiredMissions } from "@/lib/server/balls";

export const POST = route(async () => {
  await requireAdmin();

  const penalizedCount = await checkAndPenalizeExpiredMissions();

  return json({
    success: true,
    data: {
      penalizedCount,
      message: `${penalizedCount} ta foydalanuvchiga jazo ball qo'llanildi`,
    },
  });
});
