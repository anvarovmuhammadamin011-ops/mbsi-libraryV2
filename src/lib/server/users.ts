import { prisma } from "@/lib/db";
import { hashPassword, generatePassword } from "./password";
import { encryptPassword } from "./password-crypto";
import { logAudit } from "./audit";
import { invalidateUserSessions } from "./auth";
import { ApiError, ERROR_CODES } from "./errors";
import { USER_TYPE_OPTIONS } from "@/types";
import type { UserTypeChoice } from "@/types";
import type { Prisma } from "@prisma/client";

// ─── Role mapping ───────────────────────────────────────────
// UI'dagi "Foydalanuvchi turi" → haqiqiy rol + lavozim.
export function roleFromUserType(type: UserTypeChoice): {
  role: string;
  staffPosition?: string;
} {
  switch (type) {
    case "STUDENT":
      return { role: "STUDENT" };
    case "TEACHER":
      return { role: "TEACHER", staffPosition: "O'qituvchi" };
    case "DIRECTOR":
      return { role: "STAFF", staffPosition: "Direktor" };
    case "ADMIN":
      return { role: "ADMIN", staffPosition: "Administrator" };
    case "STAFF":
      return { role: "STAFF" };
  }
}

export const VALID_USER_TYPES = USER_TYPE_OPTIONS.map((o) => o.value) as string[];

// ─── Create (ADMIN panelidan, to'g'ridan-to'g'ri) ───────────
export type ManagedUserInput = {
  userType: UserTypeChoice;
  name: string;
  username: string;
  password?: string;
  email?: string;
  phone?: string;
  // O'quvchi
  group?: string;
  age?: number | null;
  birthDate?: string | null;
  gender?: string | null;
  address?: string | null;
  parentContact?: string | null;
  about?: string | null;
  studentId?: string | null;
  // O'qituvchi / xodim
  teacherSubject?: string;
  staffPosition?: string;
  staffId?: string | null;
  isActive?: boolean;
};

export async function createManagedUser(
  input: ManagedUserInput,
  actorId: string
): Promise<{ user: { id: string; name: string; username: string; role: string } } & { plainPassword: string }> {
  const username = input.username.trim().toLowerCase();
  if (!/^[a-zA-Z0-9._-]{3,50}$/.test(username)) {
    throw new ApiError(
      ERROR_CODES.VALIDATION,
      "Login kamida 3 belgi — faqat harflar, raqamlar, . _ -",
      400
    );
  }
  const name = input.name.trim();
  if (name.length < 2) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Ism kamida 2 harf bo'lsin", 400);
  }

  const mapped = roleFromUserType(input.userType);
  if (input.userType === "STAFF" && !input.staffPosition) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Lavozimni tanlang", 400);
  }
  if (input.userType === "STUDENT" && !input.group) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Guruh/sinfni kiriting", 400);
  }

  const staffPosition =
    input.userType === "TEACHER"
      ? input.staffPosition?.trim() || "O'qituvchi"
      : mapped.staffPosition;

  const taken = await prisma.user.findUnique({ where: { username } });
  if (taken) {
    throw new ApiError(
      ERROR_CODES.CONFLICT,
      "Bu login band qilingan — boshqa login tanlang",
      409
    );
  }

  const plainPassword = input.password || generatePassword(12);
  if (plainPassword.length < 4) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Parol kamida 4 belgi bo'lsin", 400);
  }

  const birthDate = cleanDate(input.birthDate);

  // Avtomatik noyob ID — agar kiritilmagan bo'lsa generatsiya qilinadi va
  // hech qachon takrorlanmaydi (bazadan tekshirib olinadi).
  const studentId =
    (input.studentId?.trim() || null) ??
    (input.userType === "STUDENT" ? await uniqueUserCode("student") : null);
  const staffId =
    (input.staffId?.trim() || null) ??
    (input.userType !== "STUDENT" ? await uniqueUserCode("staff") : null);

  const data = mappedRoleData(mapped.role, staffPosition, input, {
    username,
    name,
    plainPassword,
    birthDate,
    studentId,
    staffId,
  });

  const user = await prisma.user.create({ data }).catch((e: unknown) => {
    const err = e as { code?: string };
    if (err?.code === "P2002") {
      throw new ApiError(ERROR_CODES.CONFLICT, "Bu login band qilingan", 409);
    }
    throw e;
  });

  await logAudit({
    userId: actorId,
    action: "CREATE_USER",
    entity: "User",
    entityId: user.id,
    metadata: { name: user.name, role: user.role, username: user.username },
  });

  return { user: { id: user.id, name: user.name, username: user.username!, role: user.role }, plainPassword };
}

function mappedRoleData(
  role: string,
  staffPosition: string | undefined,
  input: ManagedUserInput,
  ctx: {
    username: string;
    name: string;
    plainPassword: string;
    birthDate: Date | undefined;
    studentId: string | null;
    staffId: string | null;
  }
): Prisma.UserCreateInput {
  return {
    name: ctx.name,
    username: ctx.username,
    passwordHash: hashPassword(ctx.plainPassword),
    passwordEnc: encryptPassword(ctx.plainPassword),
    role,
    staffPosition: (staffPosition ?? input.staffPosition?.trim()) || null,
    teacherSubject: input.teacherSubject?.trim() || null,
    studentId: ctx.studentId,
    staffId: ctx.staffId,
    birthDate: ctx.birthDate ?? null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    group: input.group?.trim() || null,
    age: input.age ?? null,
    gender: input.gender ?? null,
    address: input.address?.trim() || null,
    parentContact: input.parentContact?.trim() || null,
    about: input.about?.trim() || null,
    isActive: input.isActive ?? true,
  };
}

// ─── Detail (profil + statistika) ───────────────────────────
export async function getManagedUserDetail(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(ERROR_CODES.NOT_FOUND, "Foydalanuvchi topilmadi", 404);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  const [
    startedCount,
    completedCount,
    activeNow,
    pagesAgg,
    currentReading,
    lastReadBook,
    sessions30,
    todaySessions,
    weekSessions,
    monthSessions,
  ] = await Promise.all([
    prisma.readingProgress.count({ where: { userId: id } }),
    prisma.readingProgress.count({ where: { userId: id, completedAt: { not: null } } }),
    prisma.readingProgress.count({ where: { userId: id, completedAt: null } }),
    prisma.readingSession.aggregate({
      where: { userId: id },
      _sum: { pagesRead: true, duration: true },
      _count: { _all: true },
    }),
    prisma.readingProgress.findFirst({
      where: { userId: id, completedAt: null },
      orderBy: { lastReadAt: "desc" },
      include: { book: { select: { id: true, title: true, slug: true, coverUrl: true } } },
    }),
    prisma.readingProgress.findFirst({
      where: { userId: id },
      orderBy: { lastReadAt: "desc" },
      include: { book: { select: { id: true, title: true, slug: true } } },
    }),
    prisma.readingSession.findMany({
      where: { userId: id, startedAt: { gte: monthAgo } },
      select: { startedAt: true },
    }),
    prisma.readingSession.count({ where: { userId: id, startedAt: { gte: startOfToday } } }),
    prisma.readingSession.count({ where: { userId: id, startedAt: { gte: weekAgo } } }),
    prisma.readingSession.count({ where: { userId: id, startedAt: { gte: monthAgo } } }),
  ]);

  const activeDays30 = new Set(
    sessions30.map((s) => s.startedAt.toISOString().slice(0, 10))
  ).size;

  const recentBooks = await prisma.readingProgress.findMany({
    where: { userId: id },
    orderBy: { lastReadAt: "desc" },
    take: 8,
    select: {
      book: { select: { id: true, title: true, slug: true, coverUrl: true } },
      currentPage: true,
      progress: true,
      startedAt: true,
      lastReadAt: true,
      completedAt: true,
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      staffPosition: user.staffPosition,
      teacherSubject: user.teacherSubject,
      studentId: user.studentId,
      staffId: user.staffId,
      birthDate: user.birthDate?.toISOString() ?? null,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      email: user.email,
      phone: user.phone,
      group: user.group,
      age: user.age,
      gender: user.gender,
      address: user.address,
      parentContact: user.parentContact,
      about: user.about,
      balls: user.balls,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    stats: {
      booksStarted: startedCount,
      booksCompleted: completedCount,
      booksActive: activeNow,
      sessions: pagesAgg._count._all ?? 0,
      pagesRead: pagesAgg._sum.pagesRead ?? 0,
      readingSeconds: pagesAgg._sum.duration ?? 0,
      todaySessions,
      weekSessions,
      monthSessions,
      activeDays30,
    },
    currentReading,
    lastReadBook,
    recentBooks: recentBooks.map((r) => ({
      bookId: r.book.id,
      title: r.book.title,
      slug: r.book.slug,
      coverUrl: r.book.coverUrl,
      currentPage: r.currentPage,
      progress: r.progress,
      startedAt: r.startedAt.toISOString(),
      lastReadAt: r.lastReadAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
    })),
  };
}

// ─── Activity range (davr bo'yicha filter) ─────────────────
export async function getUserActivityRange(userId: string, from: Date, to: Date) {
  const [sessions, pagesAgg, booksCompleted] = await Promise.all([
    prisma.readingSession.findMany({
      where: { userId, startedAt: { gte: from, lte: to } },
      select: { startedAt: true },
    }),
    prisma.readingSession.aggregate({
      where: { userId, startedAt: { gte: from, lte: to } },
      _sum: { pagesRead: true, duration: true },
    }),
    prisma.readingProgress.count({
      where: { userId, completedAt: { gte: from, lte: to } },
    }),
  ]);

  const activeDays = new Set(sessions.map((s) => s.startedAt.toISOString().slice(0, 10))).size;

  return {
    sessions: sessions.length,
    pagesRead: pagesAgg._sum.pagesRead ?? 0,
    readingSeconds: pagesAgg._sum.duration ?? 0,
    activeDays,
    booksCompleted,
  };
}

// ─── Update ─────────────────────────────────────────────────
export type ManagedUserPatch = {
  name?: string;
  email?: string;
  phone?: string;
  group?: string;
  age?: number | null;
  birthDate?: string | null;
  gender?: string | null;
  address?: string | null;
  parentContact?: string | null;
  about?: string | null;
  staffPosition?: string;
  teacherSubject?: string;
  studentId?: string | null;
  staffId?: string | null;
  isActive?: boolean;
  role?: string;
};

export async function updateManagedUser(id: string, patch: ManagedUserPatch, actorId: string) {
  const before = await prisma.user.findUnique({ where: { id } });
  if (!before) throw new ApiError(ERROR_CODES.NOT_FOUND, "Foydalanuvchi topilmadi", 404);

  const birthDate = patch.birthDate !== undefined ? cleanDate(patch.birthDate) : undefined;
  const data: Prisma.UserUpdateInput = {};
  if (patch.name !== undefined) data.name = patch.name.trim();
  if (patch.email !== undefined) data.email = emptyToNull(patch.email);
  if (patch.phone !== undefined) data.phone = emptyToNull(patch.phone);
  if (patch.group !== undefined) data.group = emptyToNull(patch.group);
  if (patch.age !== undefined) data.age = patch.age;
  if (birthDate !== undefined) data.birthDate = birthDate;
  if (patch.gender !== undefined) data.gender = emptyToNull(patch.gender);
  if (patch.address !== undefined) data.address = emptyToNull(patch.address);
  if (patch.parentContact !== undefined) data.parentContact = emptyToNull(patch.parentContact);
  if (patch.about !== undefined) data.about = emptyToNull(patch.about);
  if (patch.staffPosition !== undefined) data.staffPosition = emptyToNull(patch.staffPosition);
  if (patch.teacherSubject !== undefined) data.teacherSubject = emptyToNull(patch.teacherSubject);
  if (patch.studentId !== undefined) data.studentId = emptyToNull(patch.studentId);
  if (patch.staffId !== undefined) data.staffId = emptyToNull(patch.staffId);
  if (patch.isActive !== undefined) data.isActive = patch.isActive;
  if (patch.role !== undefined) data.role = patch.role;

  const user = await prisma.user.update({ where: { id }, data });

  const actions: string[] = [];
  if (patch.isActive !== undefined && patch.isActive !== before.isActive) {
    actions.push(patch.isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER");
  }
  if (patch.role !== undefined && patch.role !== before.role) {
    await logAudit({
      userId: actorId,
      action: "CHANGE_ROLE",
      entity: "User",
      entityId: id,
      metadata: { name: user.name, role: user.role },
    });
  }
  if (actions.length) {
    await logAudit({
      userId: actorId,
      action: actions[0],
      entity: "User",
      entityId: id,
      metadata: { name: user.name },
    });
  }
  await logAudit({
    userId: actorId,
    action: "UPDATE_USER",
    entity: "User",
    entityId: id,
    metadata: { name: user.name },
  });
  return user;
}

// ─── Reset password ─────────────────────────────────────────
export async function resetUserPassword(id: string, actorId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(ERROR_CODES.NOT_FOUND, "Foydalanuvchi topilmadi", 404);

  const plain = generatePassword(12);
  await prisma.user.update({
    where: { id },
    data: { passwordHash: hashPassword(plain), passwordEnc: encryptPassword(plain) },
  });
  // Eski barcha sessiyalarni bekor qilish — eski parollar bilan "eski" token ishlamaydi
  await invalidateUserSessions(id);
  await logAudit({
    userId: actorId,
    action: "RESET_PASSWORD",
    entity: "User",
    entityId: id,
    metadata: { name: user.name },
  });
  return plain;
}

// ─── Helpers ────────────────────────────────────────────────
async function uniqueUserCode(kind: "student" | "staff"): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = kind === "student" ? `${year}` : "ST";
  for (let i = 0; i < 10; i++) {
    const code = `${prefix}-${String(Math.floor(100 + Math.random() * 900))}`;
    const taken = await prisma.user.findFirst({
      where: kind === "student" ? { studentId: code } : { staffId: code },
      select: { id: true },
    });
    if (!taken) return code;
  }
  // Kamdan-kam holda barchasi band bo'lsa — unikal vaqtga asoslangan kod.
  return `${prefix}-${String(Date.now()).slice(-6)}`;
}

function emptyToNull(v: string | null | undefined): string | null {
  if (v === undefined) return undefined as unknown as string | null;
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

function cleanDate(v: string | null | undefined): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}