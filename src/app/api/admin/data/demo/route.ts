import { route, readJson } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// Demo seed ID'lari (prisma/seed.mjs dagi deterministik ID'lar)
const DEMO_USER_IDS = Array.from({ length: 8 }, (_, i) => `user-${i + 1}`);
const DEMO_BOOK_IDS = [
  "book-ali",
  ...Array.from({ length: 50 }, (_, i) => `book-${i + 1}`),
];

// POST /api/admin/data/demo — { action: "delete-books" | "delete-students" | "reset" }
export const POST = route(async (req) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const body = (await readJson(req).catch(() => ({}))) as {
    action?: string;
  };
  const action = body.action;

  if (action === "delete-books") {
    const r = await prisma.book.deleteMany({
      where: { id: { in: DEMO_BOOK_IDS } },
    });
    return success({ ok: true, deleted: r.count });
  }

  if (action === "delete-students") {
    const ids = DEMO_USER_IDS.filter((id) => id !== admin.id);
    const r = await prisma.user.deleteMany({
      where: { id: { in: ids }, role: "STUDENT" },
    });
    return success({ ok: true, deleted: r.count });
  }

  if (action === "reset") {
    try {
      await execFileAsync("node", ["prisma/seed.mjs"], {
        timeout: 120000,
        cwd: process.cwd(),
      });
      return success({ ok: true });
    } catch (e: any) {
      throw new ApiError(
        ERROR_CODES.VALIDATION,
        `Qayta yuklashda xatolik: ${e?.message ?? e}`,
        500
      );
    }
  }

  throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri amal", 400);
});
