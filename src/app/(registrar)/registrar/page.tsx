import { prisma } from "@/lib/db";
import { UserCreateForm } from "@/components/user-create-form";

export const dynamic = "force-dynamic";

export default async function RegistrarHomePage() {
  const [total, active, blocked, todayCount] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
    prisma.user.count({ where: { role: "STUDENT", isActive: false } }),
    prisma.user.count({
      where: {
        role: "STUDENT",
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Yangi o&apos;quvchi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          O&apos;quvchini to&apos;g&apos;ridan-to&apos;g&apos;ri tizimga qo&apos;shing —
          keyingi oynada login va parol bir marta ko&apos;rsatiladi
        </p>
      </div>

      {/* ─── O'quvchilar statistikasi ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Jami o&apos;quvchilar</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums">{total}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Faol</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-green-600">
            {active}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Bloklangan</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-red-500">
            {blocked}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Bugun qo&apos;shilgan</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-amber-600">
            {todayCount}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl">
        <UserCreateForm
          createUrl="/api/registrar/students"
          onlyType="STUDENT"
          profileUrl={null}
          submitLabel="O'quvchi qo'shish"
        />
      </div>
    </div>
  );
}