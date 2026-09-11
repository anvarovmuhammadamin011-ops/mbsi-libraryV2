import { route } from "@/lib/server/handler";
import { requireBookManager } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/server/books";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";
import { notifyNewCategory } from "@/lib/server/notify";

export const POST = route(async (req) => {
  const user = await requireBookManager();
  const { name } = await req.json();
  if (!name || !String(name).trim()) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Nomi kerak", 400);
  }
  const category = await prisma.category.create({
    data: { name: String(name).trim(), slug: slugify(String(name)) },
  });
  notifyNewCategory(category.name);
  return success(category, 201);
});
