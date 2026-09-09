import { requireRole } from "@/lib/server/auth";
import { getDiagnosticsData } from "@/lib/server/diagnostics";
import { DiagnosticsDashboard } from "@/components/diagnostics-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDiagnosticsPage() {
  const admin = await requireRole("ADMIN");
  if (!admin) return null;

  const data = await getDiagnosticsData();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Diagnostika</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Mutolaa tahlili, kategoriya insightlari, foydalanuvchi faolligi va tizim holati
        </p>
      </div>

      <DiagnosticsDashboard data={data} />
    </div>
  );
}
