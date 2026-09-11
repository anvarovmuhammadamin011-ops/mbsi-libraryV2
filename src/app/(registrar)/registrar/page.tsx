import { prisma } from "@/lib/db";
import { StudentForm } from "@/components/student-form";

export const dynamic = "force-dynamic";

export default async function RegistrarHomePage() {
  const [pendingCount, approvedCount, rejectedCount, todayCount] =
    await Promise.all([
      prisma.pendingStudent.count({ where: { status: "PENDING" } }),
      prisma.pendingStudent.count({ where: { status: "APPROVED" } }),
      prisma.pendingStudent.count({ where: { status: "REJECTED" } }),
      prisma.pendingStudent.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Yangi o&apos;quvchi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          O&apos;quvchi ma&apos;lumotlarini yuboring — admin tasdiqlagach tizimga
          qo&apos;shiladi
        </p>
      </div>

      {/* ─── Ariza statistikasi (o'z arizalari bo'yicha emas, umumiy) ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Bugun yuborilgan</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums">{todayCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Kutilmoqda</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-amber-600">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Tasdiqlangan</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-green-600">
            {approvedCount}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Rad etilgan</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-red-500">
            {rejectedCount}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <StudentForm redirectTo="/registrar/requests" />
      </div>
    </div>
  );
}
