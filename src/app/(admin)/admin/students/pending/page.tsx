import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { PendingStudentsTable } from "@/components/pending-students-table";
import { TriangleAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PendingStudentsPage() {
  const user = await requireRole("ADMIN");
  if (!user) return null;

  const items = await prisma.pendingStudent.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      login: true,
      email: true,
      phone: true,
      group: true,
      age: true,
      gender: true,
      address: true,
      parentContact: true,
      healthNote: true,
      about: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <TriangleAlert size={22} className="text-amber-500" />
          Tasdiqlanishni kutayotganlar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ⚠️ {items.length} ta yangi o&apos;quvchi qo&apos;shilishni kutmoqda
        </p>
      </div>
      <PendingStudentsTable
        items={items.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
