import { route, json } from "@/lib/server/handler";
import { requireAdmin } from "@/lib/server/auth";
import { saveCover } from "@/lib/server/storage";
import { validateCover } from "@/lib/server/pdf";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

// Generic image upload (banners / avatars). Returns a public URL.
export const POST = route(async (req) => {
  await requireAdmin();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new ApiError(ERROR_CODES.INVALID_FILE, "Fayl topilmadi", 400);
  }
  const buf = Buffer.from(await file.arrayBuffer());
  validateCover(buf, file.type, file.name);
  const saved = await saveCover(file);
  return json({ success: true, data: { url: saved.urlOrKey } }, 201);
});
