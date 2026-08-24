import { route, json, readJson } from "@/lib/server/handler";
import { getSessionUser } from "@/lib/server/auth";
import { updateProfile } from "@/lib/server/catalog";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Ism juda qisqa").max(120),
  avatar: z.string().max(500).optional(),
});

export const PATCH = route(async (req) => {
  const user = await getSessionUser();
  if (!user) throw new ApiError(ERROR_CODES.UNAUTHORIZED, "Unauthorized", 401);
  const body = await readJson(req);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri ma'lumot", 400);
  }
  const updated = await updateProfile(user.id, parsed.data);
  return json({ success: true, data: updated });
});
