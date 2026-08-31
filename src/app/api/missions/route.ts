import { route, json } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { getMissionsForUser } from "@/lib/server/missions";

export const GET = route(async () => {
  const user = await requireUser();
  const missions = await getMissionsForUser(user.id);
  return json({ success: true, data: missions });
});
