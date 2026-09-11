import { route, readJson } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";
import { notifyNewStudent } from "@/lib/server/notify";

// PATCH /api/admin/students/pending/[id] — { action: "approve" | "reject" }
export const PATCH = route(async (req, ctx) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const { id } = await ctx.params;
  const body = (await readJson(req).catch(() => ({}))) as {
    action?: string;
  };
  const action = body.action;

  const pending = await prisma.pendingStudent.findUnique({ where: { id } });
  if (!pending || pending.status !== "PENDING") {
    throw new ApiError(ERROR_CODES.NOT_FOUND, "Ariza topilmadi", 404);
  }

  if (action === "reject") {
    await prisma.pendingStudent.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    return success({ ok: true, action: "reject" });
  }

  if (action === "approve") {
    const name = `${pending.firstName} ${pending.lastName}`.trim();
    const user = await prisma.user.create({
      data: {
        name,
        role: "STUDENT",
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
      data: { status: "APPROVED" },
    });
    notifyNewStudent(name, pending.email ?? "", pending.group ?? "");
    return success({ ok: true, action: "approve", userId: user.id });
  }

  throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri amal", 400);
});
