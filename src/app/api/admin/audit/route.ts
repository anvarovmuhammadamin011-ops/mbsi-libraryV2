import { route, json } from "@/lib/server/handler";
import { requireAdmin } from "@/lib/server/auth";
import { listAuditLogs } from "@/lib/server/catalog";

export const GET = route(async (req) => {
  await requireAdmin();
  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const result = await listAuditLogs(100, page);
  return json({
    success: true,
    data: result.items,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});
