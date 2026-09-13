import { route, readJson } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";
import {
  getSystemSettings,
  updateSystemSettings,
  SETTINGS_KEYS,
} from "@/lib/server/system-settings";

export const GET = route(async () => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  return success(await getSystemSettings());
});

export const PATCH = route(async (req) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);

  const body = await readJson<Record<string, unknown>>(req);
  const patch: Record<string, number | boolean> = {};
  for (const key of SETTINGS_KEYS) {
    if (body[key] === undefined) continue;
    if (key === "staffCanAccessApp") {
      patch[key] = Boolean(body[key]);
      continue;
    }
    const n = Number(body[key]);
    if (Number.isFinite(n) && n >= 0) patch[key] = Math.round(n);
  }

  const next = await updateSystemSettings(patch);
  return success(next);
});