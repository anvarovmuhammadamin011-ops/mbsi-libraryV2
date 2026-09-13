import { redirect } from "next/navigation";

export default function OldAdminStudentsNewRedirect() {
  redirect("/admin/users/add");
}