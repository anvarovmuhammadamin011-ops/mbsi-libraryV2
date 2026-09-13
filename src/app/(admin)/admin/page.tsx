import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { getAdminStats, type AdminStats } from "@/lib/server/admin-stats";
import { AdminActivityChart } from "@/components/admin-activity-chart";
import Link from "next/link";
import {
  Users,
  UserCheck,
  BookMarked,
  BookOpen,
  Activity,
  UserPlus,
  Star,
  TrendingUp,
  Flame,
  Clock,
  GraduationCap,
  Briefcase,
  Award,
  Swords,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const admin = await requireRole("ADMIN");
  if (!admin) return null;

  const [stats, topBookAgg, topStudentAgg, pendingCount] = await Promise.all([
    getAdminStats(),
    prisma.readingSession.groupBy({
      by: ["bookId"],
      _count: { bookId: true },
      orderBy: { _count: { bookId: "desc" } },
      take: 5,
    }),
    prisma.readingSession.groupBy({
      by: ["userId"],
      _sum: { pagesRead: true },
      where: { user: { role: "STUDENT" } },
      orderBy: { _sum: { pagesRead: "desc" } },
      take: 5,
    }),
    prisma.pendingStudent.count({ where: { status: "PENDING" } }),
  ]);

  const bookIds = topBookAgg.map((r) => r.bookId);
  const studentIds = topStudentAgg.map((r) => r.userId);
  const [topBooks, topStudents] = await Promise.all([
    bookIds.length > 0
      ? prisma.book.findMany({
          where: { id: { in: bookIds } },
          select: { id: true, title: true, author: { select: { name: true } } },
        })
      : Promise.resolve([] as { id: string; title: string; author: { name: string } | null }[]),
    studentIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, name: true, group: true },
        })
      : Promise.resolve([] as { id: string; name: string; group: string | null }[]),
  ]);

  const bookMap = new Map(topBooks.map((b) => [b.id, b]));
  const userMap = new Map(topStudents.map((u) => [u.id, u]));

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.round((s % 3600) / 60);
    return h > 0 ? `${h} soat ${m > 0 ? `${m} daq` : ""}`.trim() : `${m} daq`;
  };

  const kpis = [
    {
      label: "Jami foydalanuvchilar",
      value: stats.totals.totalUsers,
      sub: `${stats.totals.students} o'quvchi · ${stats.totals.teachers} o'qituvchi · ${stats.totals.staff} xodim`,
      icon: Users,
      color: "text-primary",
      href: "/admin/users",
    },
    {
      label: "O'quvchilar",
      value: stats.totals.students,
      sub: `${stats.comparison.student.activeUsers} faol (30 kun)`,
      icon: GraduationCap,
      color: "text-blue-600",
      href: "/admin/users?tab=students",
    },
    {
      label: "O'qituvchilar",
      value: stats.totals.teachers,
      sub: `${stats.comparison.teacher.activeUsers} faol (30 kun)`,
      icon: Star,
      color: "text-violet-600",
      href: "/admin/users?tab=teachers",
    },
    {
      label: "Faol foydalanuvchilar",
      value: stats.totals.activeUsers,
      sub: "oxirgi 30 kun",
      icon: UserCheck,
      color: "text-green-600",
    },
    {
      label: "Jami kitob o'qishlar",
      value: stats.totals.totalSessions,
      sub: `${stats.totals.totalPagesRead.toLocaleString()} sahifa o'qildi`,
      icon: BookOpen,
      color: "text-orange-500",
    },
    {
      label: "Yangi foydalanuvchilar",
      value: stats.totals.newThisWeek,
      sub: "shu hafta qo'shildi",
      icon: UserPlus,
      color: "text-amber-600",
      href: "/admin/users",
    },
  ];

  const todayKpis = [
    { label: "Bugun kirganlar", value: stats.today.logins, icon: UserCheck },
    { label: "Kitob ochildi", value: stats.today.booksOpened, icon: BookMarked },
    { label: "Kitob o'qildi", value: stats.today.booksRead, icon: BookOpen },
    { label: "Kitob tugatildi", value: stats.today.booksCompleted, icon: Award },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Boshqaruv paneli</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Maktab kutubxonasining hozirgi holati — bir qarashda
        </p>
      </div>

      {/* ─── Asosiy KPI kartalar ─── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((s) => {
          const Icon = s.icon;
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-muted-foreground leading-snug">
                  {s.label}
                </p>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/60 ${s.color}`}>
                  <Icon size={16} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {s.value.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">{s.sub}</p>
            </>
          );
          return s.href ? (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md"
            >
              {inner}
            </Link>
          ) : (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              {inner}
            </div>
          );
        })}
      </div>

      {/* ─── Bugungi faoliyat ─── */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {todayKpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{k.label}</span>
                <Icon size={15} className="text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold tabular-nums">{k.value}</p>
            </div>
          );
        })}
      </div>

      {/* ─── Grafik + Battle ─── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <h2 className="text-base font-semibold">Foydalanuvchilar faolligi (7 kun)</h2>
          </div>
          <AdminActivityChart
            data={stats.graph.map((d) => ({ date: d.date, label: d.label, sessions: d.sessions }))}
          />
        </div>

        {/* Battle preview */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Swords size={16} className="text-primary" />
            <h2 className="text-base font-semibold">Battle — O&apos;quvchilar vs O&apos;qituvchilar</h2>
          </div>
          <BattleMini stats={stats.comparison} />
          <Link
            href="/admin/battle"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            Batafsil →
          </Link>
        </div>
      </div>

      {/* ─── Faollik taqqoslash ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <GraduationCap size={16} className="text-primary" />
            <h2 className="text-sm font-semibold">O&apos;quvchilar</h2>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="O'qish soni" value={`${stats.comparison.student.totalReads} ta sessiya`} />
            <Row label="O'rtacha o'qishlar" value={stats.comparison.student.avgReads.toFixed(1)} />
            <Row label="O'qilgan sahifalar" value={stats.comparison.student.totalPagesRead.toLocaleString()} />
            <Row label="Tugatilgan" value={String(stats.comparison.student.totalCompleted)} />
            {stats.comparison.student.top && (
              <Row label="Eng faol" value={stats.comparison.student.top.name} />
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Briefcase size={16} className="text-primary" />
            <h2 className="text-sm font-semibold">O&apos;qituvchilar</h2>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="O'qish soni" value={`${stats.comparison.teacher.totalReads} ta sessiya`} />
            <Row label="O'rtacha o'qishlar" value={stats.comparison.teacher.avgReads.toFixed(1)} />
            <Row label="O'qilgan sahifalar" value={stats.comparison.teacher.totalPagesRead.toLocaleString()} />
            <Row label="Tugatilgan" value={String(stats.comparison.teacher.totalCompleted)} />
            {stats.comparison.teacher.top && (
              <Row
                label="Eng faol"
                value={
                  stats.comparison.teacher.top.position
                    ? `${stats.comparison.teacher.top.name} (${stats.comparison.teacher.top.position})`
                    : stats.comparison.teacher.top.name
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* ─── Tasdiqlash kutilmoqda ─── */}
      {pendingCount > 0 && (
        <Link
          href="/admin/students/pending"
          className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 font-medium text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-300"
        >
          <UserPlus size={18} />
          {pendingCount} ta yangi o&apos;quvchi arizasi tasdiqlashni kutmoqda →
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Eng ko'p o'qilgan kitoblar (Top 5) */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Star size={15} className="text-primary" />
              Eng ko&apos;p o&apos;qilgan kitoblar
            </h2>
          </div>
          {topBookAgg.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Hali o'qish statistikasi yo'q</p>
          ) : (
            <ol className="space-y-2.5">
              {topBookAgg.map((r, i) => {
                const b = bookMap.get(r.bookId);
                return (
                  <li key={r.bookId} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b?.title ?? "—"}</p>
                      <p className="truncate text-xs text-muted-foreground">{b?.author?.name ?? ""}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                      {r._count.bookId} o&apos;qish
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Eng faol o'quvchilar (Top 5) */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Users size={15} className="text-primary" />
              Eng faol o&apos;quvchilar
            </h2>
            <Link href="/admin/users?tab=students" className="text-xs font-medium text-primary hover:underline">
              Barchasi
            </Link>
          </div>
          {topStudentAgg.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Hali faollik statistikasi yo'q</p>
          ) : (
            <ol className="space-y-2.5">
              {topStudentAgg.map((r, i) => {
                const u = userMap.get(r.userId);
                return (
                  <li key={r.userId} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u?.name ?? "—"}</p>
<p className="truncate text-xs text-muted-foreground">{u?.group ?? ""}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                      {(r._sum.pagesRead ?? 0).toLocaleString()} bet
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function BattleMini({
  stats,
}: {
  stats: AdminStats["comparison"];
}) {
  const student = stats.student;
  const teacher = stats.teacher;
  const totalScore = student.totalPagesRead + teacher.totalPagesRead || 1;
  const sPct = Math.round((student.totalPagesRead / totalScore) * 100);
  const tPct = 100 - sPct;
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-blue-600">STUDENTS</span>
          <span className="font-semibold tabular-nums">{sPct}%</span>
        </div>
        <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-700"
            style={{ width: `${sPct}%` }}
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-primary">TEACHERS</span>
          <span className="font-semibold tabular-nums">{tPct}%</span>
        </div>
        <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${tPct}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{student.totalPagesRead.toLocaleString()} bet</span>
        <span>{teacher.totalPagesRead.toLocaleString()} bet</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}