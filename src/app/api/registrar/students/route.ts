import { route, json, readJson } from "@/lib/server/handler";
import { requireRegistrar } from "@/lib/server/auth";
import { createManagedUser } from "@/lib/server/users";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

// POST /api/registrar/students — o'quvchini to'g'ridan-to'g'ri tizimga qo'shish.
// Yaratilgan o'quvchi darhol admin foydalanuvchilar ro'yxatida ko'rinadi.
export const POST = route(async (req) => {
  const actor = await requireRegistrar();
  const body = await readJson<Record<string, unknown>>(req);

  if ((body.userType as string) !== "STUDENT") {
    throw new ApiError(ERROR_CODES.VALIDATION, "Faqat o'quvchi qo'shish mumkin", 400);
  }
  if (typeof body.name !== "string" || typeof body.username !== "string") {
    throw new ApiError(ERROR_CODES.VALIDATION, "Ism va login kiriting", 400);
  }

  const result = await createManagedUser(
    {
      userType: "STUDENT",
      name: body.name,
      username: body.username,
      password: typeof body.password === "string" ? body.password : undefined,
      email: str(body.email),
      phone: str(body.phone),
      group: str(body.group),
      age: numOrNull(body.age),
      birthDate: str(body.birthDate) || null,
      gender: str(body.gender) || null,
      address: str(body.address),
      parentContact: str(body.parentContact),
      about: str(body.about),
      studentId: str(body.studentId),
      isActive: true,
    },
    actor.id
  );

  return json({ success: true, data: result }, 201);
});

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function numOrNull(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}