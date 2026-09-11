import { route } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";
import { isTelegramConfigured, sendTestMessage } from "@/lib/server/notify";

// GET /api/admin/telegram/status — token/chatId sozlanganmi?
export const GET = route(async () => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  return success({ configured: isTelegramConfigured() });
});

// POST /api/admin/telegram/test — sinov xabari yuborish
export const POST = route(async () => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const ok = await sendTestMessage();
  if (!ok) {
    throw new ApiError(
      ERROR_CODES.VALIDATION,
      "Yuborilmadi — TELEGRAM_BOT_TOKEN yoki TELEGRAM_ADMIN_CHAT_ID sozlanmagan",
      400
    );
  }
  return success({ ok: true });
});
