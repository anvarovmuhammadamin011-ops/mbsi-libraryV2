import { route, json } from "@/lib/server/handler";
import { requireUser, clearSessionCookie } from "@/lib/server/auth";

export const POST = route(async () => {
  const res = json({ success: true, data: null });
  clearSessionCookie(res);
  return res;
});
