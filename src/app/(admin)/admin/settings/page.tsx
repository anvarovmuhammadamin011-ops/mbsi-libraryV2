import { redirect } from "next/navigation";

export default function OldAdminSettingsRedirect() {
  redirect("/admin/system");
}