import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { AdminStudentsTable } from "@/components/admin-students-table";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const user = await requireRole("ADMIN");
  if (!user) return null;

  const [students, pendingCount] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { progress: true } } },
      take: 300,
    }),
    prisma.pendingStudent.count({ where: { status: "PENDING" } }),
  ]);

  const groups = Array.from(
    new Set(students.map((s) => s.group).filter(Boolean) as string[])
  ).sort();

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">O&apos;quvchilar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {students.length} ta o&apos;quvchi
            {pendingCount > 0 && (
              <>
                {" · "}
                <Link
                  href="/admin/students/pending"
                  className="font-medium text-amber-600 hover:underline"
                >
                  {pendingCount} ta kutilmoqda
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/students/pending"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            Kutilayotganlar
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-500/15 px-1.5 text-xs font-bold text-amber-600">
                {pendingCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin/students/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={16} /> Yangi o&apos;quvchi
          </Link>
        </div>
      </div>

      <AdminStudentsTable
        students={students.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          group: s.group,
          age: s.age,
          gender: s.gender,
          address: s.address,
          parentContact: s.parentContact,
          healthNote: s.healthNote,
          about: s.about,
          isActive: s.isActive,
          bookCount: s._count.progress,
          createdAt: s.createdAt.toISOString(),
        }))}
        groups={groups}
        currentUserId={user.id}
      />
    </div>
  );
}
