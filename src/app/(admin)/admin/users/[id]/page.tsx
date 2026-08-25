import Link from "next/link";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  FileText,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h} soat${m > 0 ? ` ${m} daq` : ""}`;
  return `${m} daq`;
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireRole("ADMIN");
  if (!admin) return null;
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;

  const [progressList, sessionAgg, totals] = await Promise.all([
    prisma.readingProgress.findMany({
      where: { userId: id },
      include: {
        book: { include: { author: { select: { name: true } }, category: { select: { name: true } } } },
      },
      orderBy: { lastReadAt: "desc" },
    }),
    prisma.readingSession.groupBy({
      by: ["bookId"],
      where: { userId: id },
      _sum: { duration: true, pagesRead: true },
      _count: { _all: true },
    }),
    prisma.readingSession.aggregate({
      where: { userId: id },
      _sum: { duration: true, pagesRead: true },
    }),
  ]);

  const timeByBook = new Map(
    sessionAgg.map((s) => [s.bookId, s._sum.duration ?? 0])
  );
  const pagesByBook = new Map(
    sessionAgg.map((s) => [s.bookId, s._sum.pagesRead ?? 0])
  );

  const completedCount = progressList.filter((p) => p.completedAt).length;
  const totalPagesRead =
    totals._sum.pagesRead ?? 0;

  const roleLabel =
    user.role === "ADMIN" ? "Admin" : user.role === "TEACHER" ? "O'qituvchi" : "O'quvchi";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/admin/users" />}
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 mb-3"
        >
          <ArrowLeft size={15} /> Foydalanuvchilar
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {user.name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={user.role === "ADMIN" ? "default" : "secondary"}
                className={`text-[10px] ${
                  user.role === "TEACHER" ? "bg-blue-500/10 text-blue-600" : ""
                }`}
              >
                {roleLabel}
              </Badge>
              <Badge
                variant={user.isActive ? "secondary" : "destructive"}
                className={`text-[10px] ${user.isActive ? "bg-green-500/10 text-green-600" : ""}`}
              >
                {user.isActive ? "Faol" : "Nofaol"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Qo&apos;shilgan: {new Date(user.createdAt).toLocaleDateString("uz-UZ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground">Jami o&apos;qish vaqti</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {formatDuration(totals._sum.duration ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-green-600" />
            <span className="text-xs text-muted-foreground">O&apos;qilgan sahifalar</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {(totalPagesRead || 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-orange-500" />
            <span className="text-xs text-muted-foreground">Kitoblar</span>
          </div>
          <p className="text-xl font-bold text-foreground">{progressList.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span className="text-xs text-muted-foreground">Tugatilgan</span>
          </div>
          <p className="text-xl font-bold text-foreground">{completedCount}</p>
        </div>
      </div>

      {/* Books */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h2 className="text-sm font-semibold text-foreground">
            O&apos;qigan kitoblari ({progressList.length})
          </h2>
        </div>
        {progressList.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Bu foydalanuvchi hali kitob o&apos;qimagan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                  <th className="px-4 py-3">Kitob</th>
                  <th className="px-4 py-3 hidden md:table-cell">Kategoriya</th>
                  <th className="px-4 py-3 w-40">Progress</th>
                  <th className="px-4 py-3 text-right">Sarflangan vaqt</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">O&apos;qilgan sahifa</th>
                  <th className="px-4 py-3 text-right hidden lg:table-cell">Oxirgi faollik</th>
                  <th className="px-4 py-3 text-center">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {progressList.map((p) => {
                  const totalP = p.book.totalPages || 1;
                  const pct = Math.min(100, Math.round((p.currentPage / totalP) * 100));
                  return (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground truncate max-w-[220px]">
                          {p.book.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{p.book.author?.name}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {p.book.category?.name ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[60px]">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-9">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-foreground whitespace-nowrap">
                        {formatDuration(timeByBook.get(p.bookId) ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden sm:table-cell">
                        {(pagesByBook.get(p.bookId) ?? 0).toLocaleString()} / {totalP}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden lg:table-cell">
                        {new Date(p.lastReadAt).toLocaleDateString("uz-UZ")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.completedAt ? (
                          <Badge className="text-[10px] bg-green-500/10 text-green-600">
                            Yakunlangan
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Jarayonda
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
