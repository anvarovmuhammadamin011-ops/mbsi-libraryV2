import { redirect } from "next/navigation";
import { getSessionUser } from "./auth";
import type { User } from "@prisma/client";

export async function guardPage(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function guardAdmin(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/home");
  return user;
}
