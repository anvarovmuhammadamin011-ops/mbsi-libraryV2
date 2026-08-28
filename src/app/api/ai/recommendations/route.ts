import { route, json } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { getAiRecommendations } from "@/lib/server/ai-recommendations";

export const GET = route(async () => {
  const user = await requireUser();
  const recs = await getAiRecommendations(user.id, 6);
  return json({ success: true, data: recs });
});
