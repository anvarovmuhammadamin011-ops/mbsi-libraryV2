import { prisma } from "@/lib/db";
import { pendingStudentSchema } from "@/lib/validation";
import { ApiError, ERROR_CODES } from "./errors";
import { hashPassword } from "./password";
import { encryptPassword } from "./password-crypto";

export type PendingInput = ReturnType<typeof pendingStudentSchema.parse>;

// ─── Ariza yaratish (Admin/REGISTRAR) ───
export async function createPendingStudent(
  input: PendingInput,
  submittedById: string | null
) {
  const login = input.login.trim().toLowerCase();

  // Login band emasligini tekshiramiz (pending va user jadvallarida)
  const [loginTakenPending, loginTakenUser] = await Promise.all([
    prisma.pendingStudent.findFirst({ where: { login, status: "PENDING" } }),
    prisma.user.findUnique({ where: { username: login } }),
  ]);
  if (loginTakenPending || loginTakenUser) {
    throw new ApiError(
      ERROR_CODES.VALIDATION,
      "Bu login band qilingan — boshqa login tanlang",
      409
    );
  }

  const item = await prisma.pendingStudent.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      login,
      passwordHash: hashPassword(input.password),
      passwordEnc: encryptPassword(input.password),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      group: input.group.trim(),
      age: input.age,
      gender: input.gender ?? null,
      address: input.address?.trim() || null,
      parentContact: input.parentContact?.trim() || null,
      healthNote: input.healthNote?.trim() || null,
      about: input.about?.trim() || null,
      avatarUrl: input.avatarUrl?.trim() || null,
      submittedById,
    },
  });

  return item;
}

// ─── Qaror: tasdiqlash / rad etish (Admin, panel) ───
export async function decidePendingStudent(
  id: string,
  action: "approve" | "reject",
  decidedById: string | null
) {
  const pending = await prisma.pendingStudent.findUnique({ where: { id } });
  if (!pending || pending.status !== "PENDING") {
    throw new ApiError(ERROR_CODES.NOT_FOUND, "Ariza topilmadi", 404);
  }

  if (action === "reject") {
    await prisma.pendingStudent.update({
      where: { id },
      data: { status: "REJECTED", decidedById },
    });
    return { action, approved: false, userId: null as string | null };
  }

  const name = `${pending.firstName} ${pending.lastName}`.trim();
  const user = await prisma.user.create({
    data: {
      name,
      role: "STUDENT",
      username: pending.login,
      passwordHash: pending.passwordHash,
      passwordEnc: pending.passwordEnc,
      avatar: pending.avatarUrl,
      email: pending.email,
      phone: pending.phone,
      group: pending.group,
      age: pending.age,
      gender: pending.gender,
      address: pending.address,
      parentContact: pending.parentContact,
      about: pending.about,
      isActive: true,
    },
  });
  await prisma.pendingStudent.update({
    where: { id },
    data: { status: "APPROVED", decidedById, studentId: user.id },
  });
  return { action, approved: true, userId: user.id };
}
