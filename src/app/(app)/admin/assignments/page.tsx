export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { ClipboardList, Plus, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Assignment = {
  id: string;
  title: string;
  bookTitle: string;
  pages: string;
  targetUser: string;
  deadline: string;
  status: string;
  createdAt: string;
};

export default async function AssignmentsPage() {
  // Count by status (using reading progress as proxy)
  const totalUsers = await prisma.user.count({ where: { role: "STUDENT" } });
  const totalBooks = await prisma.book.count();

  // Demo assignments data
  const assignments: Assignment[] = [
    { id: "1", title: "O'tkan kunlarni o'qish", bookTitle: "O'tkan kunlar", pages: "1-50", targetUser: "3-sinf A guruhi", deadline: "2026-09-01", status: "pending", createdAt: "2026-08-20" },
    { id: "2", title: "Atomic Habits — 1-qism", bookTitle: "Atomic Habits", pages: "1-100", targetUser: "Barcha o'quvchilar", deadline: "2026-08-30", status: "in_progress", createdAt: "2026-08-18" },
    { id: "3", title: "Jahon tarixi — 8-sinf", bookTitle: "8-sinf Jahon tarixi", pages: "1-30", targetUser: "8-sinf B guruhi", deadline: "2026-08-25", status: "completed", createdAt: "2026-08-15" },
    { id: "4", title: "Matematika asoslari", bookTitle: "Matematika", pages: "1-20", targetUser: "Nodira Karimova", deadline: "2026-08-22", status: "overdue", createdAt: "2026-08-10" },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const statusLabels: Record<string, string> = {
    pending: "Kutilmoqda",
    in_progress: "Jarayonda",
    completed: "Tugallangan",
    overdue: "Muddati o'tgan",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock size={12} />,
    in_progress: <ClipboardList size={12} />,
    completed: <CheckCircle size={12} />,
    overdue: <XCircle size={12} />,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Topshiriqlar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            O&apos;quvchilarga kitob o&apos;qish topshiriqlarini boshqaring
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus size={16} />
          Yangi topshiriq
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Jami", value: assignments.length, color: "text-foreground" },
          { label: "Kutilmoqda", value: assignments.filter((a) => a.status === "pending").length, color: "text-yellow-600" },
          { label: "Jarayonda", value: assignments.filter((a) => a.status === "in_progress").length, color: "text-blue-600" },
          { label: "Muddati o'tgan", value: assignments.filter((a) => a.status === "overdue").length, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Topshiriq</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kitob</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sahifalar</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kimga</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Muddat</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Holat</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{a.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.bookTitle}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.pages}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.targetUser}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.deadline}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[a.status]}`}>
                      {statusIcons[a.status]}
                      {statusLabels[a.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Tahrirlash
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
