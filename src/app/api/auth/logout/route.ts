import { route, json } from "@/lib/server/handler";
import { requireUser, clearSessionCookie } from "@/lib/server/auth";
import { clearCsrfCookie } from "@/lib/server/csrf";

export const POST = route(async () => {
  await requireUser();
  const res = json({ success: true, data: null });
  clearSessionCookie(res);
  clearCsrfCookie(res);
  return res;
});
