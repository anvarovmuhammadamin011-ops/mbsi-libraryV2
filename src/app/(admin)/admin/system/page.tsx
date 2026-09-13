import { requireRole } from "@/lib/server/auth";
import { SystemSettingsForm } from "@/components/system-settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  const admin = await requireRole("ADMIN");
  if (!admin) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tizim boshqaruvi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kitob o&apos;qish faolligi va battle qoidalarini sozlash
        </p>
      </div>
      <SystemSettingsForm />
    </div>
  );
}