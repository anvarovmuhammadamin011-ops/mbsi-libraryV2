import { route, json } from "@/lib/server/handler";
import { getSessionUser } from "@/lib/server/auth";
import type { User } from "@/types";

export const GET = route(async () => {
  const u = await getSessionUser();
  const user: User | null = u
    ? {
        id: u.id,
        name: u.name,
        role: u.role as User["role"],
        avatar: u.avatar ?? undefined,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      }
    : null;
  return json({ success: true, data: user });
});
