import { route, json } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { getDiagnosticsData } from "@/lib/server/diagnostics";

export const GET = route(async () => {
  const admin = await requireRole("ADMIN");
  if (!admin) return json({ success: false, error: "Ruxsat yo'q" }, 403);

  const data = await getDiagnosticsData();
  return json({ success: true, data });
});
