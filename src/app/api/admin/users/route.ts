import { route, json, readJson } from "@/lib/server/handler";
import { requireAdmin } from "@/lib/server/auth";
import { listUsers, updateUser } from "@/lib/server/catalog";
import { createManagedUser, VALID_USER_TYPES } from "@/lib/server/users";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const GET = route(async (req) => {
  await requireAdmin();
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const role = req.nextUrl.searchParams.get("role") ?? undefined;
  const items = await listUsers({ q, role: role ?? undefined });
  return json({ success: true, data: items });
});

export const POST = route(async (req) => {
  const admin = await requireAdmin();
  const body = await readJson<Record<string, unknown>>(req);

  const userType = body.userType as string;
  if (!VALID_USER_TYPES.includes(userType)) {
    throw new ApiError(
      ERROR_CODES.VALIDATION,
      "Foydalanuvchi turini tanlang",
      400
    );
  }
  if (typeof body.name !== "string" || typeof body.username !== "string") {
    throw new ApiError(ERROR_CODES.VALIDATION, "Ism va login kiriting", 400);
  }

  const result = await createManagedUser(
    {
      userType: userType as Parameters<typeof createManagedUser>[0]["userType"],
      name: body.name,
      username: body.username,
      password: typeof body.password === "string" ? body.password : undefined,
      email: str(body.email),
      phone: str(body.phone),
      avatar: str(body.avatar),
      group: str(body.group),
      age: numOrNull(body.age),
      birthDate: str(body.birthDate) || null,
      gender: str(body.gender) || null,
      address: str(body.address),
      parentContact: str(body.parentContact),
      about: str(body.about),
      studentId: str(body.studentId),
      teacherSubject: str(body.teacherSubject),
      staffPosition: str(body.staffPosition),
      staffId: str(body.staffId),
      isActive: typeof body.isActive === "boolean" ? body.isActive : true,
    },
    admin.id
  );

  return json({ success: true, data: result }, 201);
});

export const PATCH = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const body = await readJson<Record<string, unknown>>(req);
  const patch = {
    isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    role: typeof body.role === "string" ? body.role : undefined,
  };
  if (patch.isActive === undefined && patch.role === undefined) {
    throw new ApiError(ERROR_CODES.VALIDATION, "O'zgarish kiritilmadi", 400);
  }
  const user = await updateUser(id, { ...patch, userId: admin.id });
  return json({ success: true, data: user });
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