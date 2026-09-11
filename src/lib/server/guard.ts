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

/** Kitob menejeri paneli — faqat ADMIN / BOOK_MANAGER. */
export async function guardBookManager(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "BOOK_MANAGER") redirect("/home");
  return user;
}

/** O'quvchi qo'shuvchi paneli — faqat ADMIN / REGISTRAR. */
export async function guardRegistrar(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "REGISTRAR") redirect("/home");
  return user;
}
