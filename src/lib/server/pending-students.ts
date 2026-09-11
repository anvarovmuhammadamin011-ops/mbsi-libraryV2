import { prisma } from "@/lib/db";
import { pendingStudentSchema } from "@/lib/validation";
import { ApiError, ERROR_CODES } from "./errors";
import { notifyNewStudentRequest } from "./notify";

export type PendingInput = ReturnType<typeof pendingStudentSchema.parse>;

// ─── Ariza yaratish (Admin/REGISTRAR) + Telegram bildirishnoma ───
export async function createPendingStudent(
  input: PendingInput,
  submittedById: string | null
) {
  const item = await prisma.pendingStudent.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
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

  // Admin Telegram orqali xabardor qilinadi (env sozlanmagan bo'lsa jim)
  let submittedByName: string | null = null;
  if (submittedById) {
    const u = await prisma.user.findUnique({
      where: { id: submittedById },
      select: { name: true },
    });
    submittedByName = u?.name ?? null;
  }
  await notifyNewStudentRequest({
    id: item.id,
    firstName: item.firstName,
    lastName: item.lastName,
    group: item.group,
    age: item.age,
    phone: item.phone,
    submittedByName,
  });

  return item;
}

// ─── Qaror: tasdiqlash / rad etish (Admin, panel yoki Telegram) ───
export async function decidePendingStudent(
  id: string,
  action: "approve" | "reject",
  decidedById: string | null,
  source: "panel" | "telegram" = "panel"
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
      avatar: pending.avatarUrl,
      email: pending.email,
      phone: pending.phone,
      group: pending.group,
      age: pending.age,
      gender: pending.gender,
      address: pending.address,
      parentContact: pending.parentContact,
      healthNote: pending.healthNote,
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

// ─── Umumiy xulosa matni (Telegram xabarni yangilash uchun) ───
export function requestSummary(p: {
  firstName: string;
  lastName: string;
  group?: string | null;
  age?: number | null;
}): string {
  return `👤 ${p.firstName} ${p.lastName}\n🎓 Guruh: ${p.group || "—"}${
    p.age ? `\n🎂 Yosh: ${p.age}` : ""
  }`;
}
