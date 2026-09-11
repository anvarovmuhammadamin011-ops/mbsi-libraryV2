import { route, readJson } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";
import { decidePendingStudent } from "@/lib/server/pending-students";

// PATCH /api/admin/students/pending/[id] — { action: "approve" | "reject" }
export const PATCH = route(async (req, ctx) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const { id } = await ctx.params;
  const body = (await readJson(req).catch(() => ({}))) as {
    action?: string;
  };
  const action = body.action;
  if (action !== "approve" && action !== "reject") {
    throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri amal", 400);
  }

  const result = await decidePendingStudent(id, action, admin.id, "panel");
  return success(result);
});
