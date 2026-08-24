import { route, json } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { listCompleted } from "@/lib/server/reading";

export const GET = route(async () => {
  const user = await requireUser();
  const items = await listCompleted(user.id);
  return json({ success: true, data: items });
});
