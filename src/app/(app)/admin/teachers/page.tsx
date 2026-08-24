export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { GraduationCap, Plus, Mail, BookOpen, Clock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function TeachersPage() {
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    include: {
      progress: { select: { currentPage: true } },
      sessions: { select: { pagesRead: true, duration: true } },
      ratings: { select: { rating: true } },
    },
  });

  const teacherData = teachers.map((t) => {
    const totalPages = t.progress.reduce((sum: number, p: { currentPage: number }) => sum + p.currentPage, 0);
    const totalSessions = t.sessions.length;
    const totalMinutes = Math.round(t.sessions.reduce((sum: number, s: { duration: number }) => sum + s.duration, 0) / 60);
    const avgRating = t.ratings.length > 0
      ? (t.ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / t.ratings.length).toFixed(1)
      : "—";
    return { ...t, totalPages, totalSessions, totalMinutes, avgRating };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ustozlar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            O&apos;qituvchilarni boshqaring
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus size={16} />
          + Ustoz qo&apos;shish
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Jami ustozlar", value: teachers.length, color: "text-foreground" },
          { label: "Faol", value: teachers.length, color: "text-green-600" },
          { label: "Jami sahifalar", value: teacherData.reduce((sum, t) => sum + t.totalPages, 0).toLocaleString(), color: "text-blue-600" },
          { label: "Jami sessiyalar", value: teacherData.reduce((sum, t) => sum + t.totalSessions, 0), color: "text-yellow-600" },
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ustoz</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sahifalar</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sessiyalar</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">O&apos;qish vaqti</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reyting</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {teacherData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Hali ustozlar yo&apos;q</p>
                  </td>
                </tr>
              ) : (
                teacherData.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{t.name}</p>
                          <p className="text-xs text-muted-foreground">O&apos;qituvchi</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.totalPages.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.totalSessions}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.totalMinutes} min</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.avgRating}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Ko&apos;rish
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive">
                          Bloklash
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
