export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { FileBarChart, Download, FileText, Table, Users, BookOpen, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ReportsPage() {
  const [totalUsers, totalBooks, totalSessions, pagesAgg, durationAgg] = await Promise.all([
    prisma.user.count(),
    prisma.book.count(),
    prisma.readingSession.count(),
    prisma.readingProgress.aggregate({ _sum: { currentPage: true } }),
    prisma.readingSession.aggregate({ _sum: { duration: true } }),
  ]);

  const totalPages = pagesAgg._sum.currentPage ?? 0;
  const totalHours = Math.round((durationAgg._sum.duration ?? 0) / 3600);

  const reports = [
    {
      id: "monthly-reading",
      title: "Oylik o'qish hisoboti",
      description: "Oy davomida o'quvchilar faoliyati, o'qilgan sahifalar va vaqt",
      icon: <BookOpen size={20} />,
      stats: `${totalPages.toLocaleString()} sahifa · ${totalHours} soat`,
      period: "Avgust 2026",
    },
    {
      id: "user-activity",
      title: "Foydalanuvchilar faolligi",
      description: "DAU, WAU, MAU va foydalanuvchilar holati",
      icon: <Users size={20} />,
      stats: `${totalUsers} foydalanuvchi`,
      period: "Avgust 2026",
    },
    {
      id: "book-analytics",
      title: "Kitoblar analitikasi",
      description: "Eng ko'p o'qilgan, eng kam o'qilgan kitoblar",
      icon: <FileText size={20} />,
      stats: `${totalBooks} kitob`,
      period: "Avgust 2026",
    },
    {
      id: "reading-sessions",
      title: "O'qish sessiyalari",
      description: "Sessiyalar soni, o'rtacha vaqt, tugatish darajasi",
      icon: <Clock size={20} />,
      stats: `${totalSessions} sessiya`,
      period: "Avgust 2026",
    },
    {
      id: "ranking-report",
      title: "Reyting hisoboti",
      description: "Eng faol o'quvchilar va o'qituvchilar reytingi",
      icon: <FileBarChart size={20} />,
      stats: "Top 50",
      period: "Avgust 2026",
    },
    {
      id: "weekly-summary",
      title: "Haftalik xulosa",
      description: "Hafta yakuni bo'yicha umumiy ma'lumot",
      icon: <Calendar size={20} />,
      stats: "33-avgust — 24-avgust",
      period: "Bu hafta",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hisobotlar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            MBSI Library statistikasi va hisobotlari
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Bugungi qisqacha</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
            <p className="text-xs text-muted-foreground mt-1">Foydalanuvchilar</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold text-foreground">{totalBooks}</p>
            <p className="text-xs text-muted-foreground mt-1">Kitoblar</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold text-foreground">{totalPages.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Sahifalar</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold text-foreground">{totalHours}h</p>
            <p className="text-xs text-muted-foreground mt-1">O'qish vaqti</p>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {r.icon}
              </div>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                <Download size={14} />
                Export
              </Button>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">{r.title}</h3>
            <p className="text-xs text-muted-foreground mb-3">{r.description}</p>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-xs font-medium text-foreground">{r.stats}</span>
              <span className="text-xs text-muted-foreground">{r.period}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Export Options */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Export formatlari</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <FileText size={14} />
            PDF export
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Table size={14} />
            Excel/CSV export
          </Button>
        </div>
      </div>
    </div>
  );
}
