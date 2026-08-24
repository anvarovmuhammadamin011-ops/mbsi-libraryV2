import { route, json, readJson } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { listContinueReading, listCompleted } from "@/lib/server/reading";

export const GET = route(async () => {
  const user = await requireUser();
  const items = await listContinueReading(user.id);
  return json({ success: true, data: items });
});
