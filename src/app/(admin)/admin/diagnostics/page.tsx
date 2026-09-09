import { redirect } from "next/navigation";

// Diagnostika bo'limi Boshqaruv paneliga ko'chirildi — eski manzilni saqlab qolish uchun redirect.
export default function AdminDiagnosticsPage() {
  redirect("/admin");
}
