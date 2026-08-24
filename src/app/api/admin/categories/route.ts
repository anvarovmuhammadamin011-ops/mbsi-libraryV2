import { route } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/server/books";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";

export const POST = route(async (req) => {
  const user = await requireRole("ADMIN");
  if (!user) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const { name } = await req.json();
  if (!name || !String(name).trim()) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Nomi kerak", 400);
  }
  const category = await prisma.category.create({
    data: { name: String(name).trim(), slug: slugify(String(name)) },
  });
  return success(category, 201);
});
