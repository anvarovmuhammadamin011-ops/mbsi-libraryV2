import { redirect } from "next/navigation";

export default function OldAdminStudentsRedirect() {
  redirect("/admin/users");
}