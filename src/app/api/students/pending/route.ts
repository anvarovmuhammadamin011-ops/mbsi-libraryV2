import { route, readJson } from "@/lib/server/handler";
import { requireRegistrar } from "@/lib/server/auth";
import { pendingStudentSchema } from "@/lib/validation";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";
import { createPendingStudent } from "@/lib/server/pending-students";

// POST /api/students/pending — yangi o'quvchi arizasi (ADMIN yoki REGISTRAR)
// Ariza darhol tizimga qo'shilmaydi — "Tasdiqlash kutilmoqda" holatida turadi.
export const POST = route(async (req) => {
  const user = await requireRegistrar();
  const body = await readJson(req);
  const parsed = pendingStudentSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Ma'lumotlar noto'g'ri", 400);
  }
  const item = await createPendingStudent(parsed.data, user.id);
  return success(item, 201);
});
