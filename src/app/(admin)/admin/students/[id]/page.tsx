import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  User,
  Users,
  BookOpen,
  Clock,
  ArrowLeft,
  CalendarDays,
  Activity,
  Award,
  Phone,
  MapPin,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0 daq";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h} soat${m > 0 ? ` ${m} daq` : ""}`;
  return `${m} daq`;
}

export default async function AdminStudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireRole("ADMIN");
  if (!admin) return null;
  const { id } = await params;

  const student = await prisma.user.findFirst({
    where: { id, role: "STUDENT" },
  });
  if (!student) notFound();

  const [
    startedCount,
    completedCount,
    pagesAgg,
    durationAgg,
    currentReading,
    lastReadBook,
    recentSessions,
    activityDates,
  ] = await Promise.all([
    prisma.readingProgress.count({ where: { userId: id } }),
    prisma.readingProgress.count({ where: { userId: id, completedAt: { not: null } } }),
    prisma.readingSession.aggregate({ where: { userId: id }, _sum: { pagesRead: true } }),
    prisma.readingSession.aggregate({ where: { userId: id }, _sum: { duration: true } }),
    prisma.readingProgress.findFirst({
      where: { userId: id, completedAt: null },
      orderBy: { lastReadAt: "desc" },
      include: { book: { select: { id: true, title: true, slug: true } } },
    }),
    prisma.readingProgress.findFirst({
      where: { userId: id },
      orderBy: { lastReadAt: "desc" },
      include: { book: { select: { id: true, title: true, slug: true } } },
    }),
    prisma.readingSession.findMany({
      where: { userId: id },
      orderBy: { startedAt: "desc" },
      take: 10,
      include: { book: { select: { id: true, title: true } } },
    }),
    prisma.readingSession.findMany({
      where: {
        userId: id,
        startedAt: { gte: new Date(Date.now() - 30 * 86400000) },
      },
      select: { startedAt: true },
    }),
  ]);

  // Faollik xaritasi (30 kun): kun → sessiyalar soni
  const now = new Date();
  const activityMap = new Map<string, number>();
  for (const s of activityDates) {
    const key = s.startedAt.toISOString().slice(0, 10);
    activityMap.set(key, (activityMap.get(key) ?? 0) + 1);
  }
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { date: d, key, count: activityMap.get(key) ?? 0 };
  });
  const activeDays = last30.filter((d) => d.count > 0).length;

  const totalPages = pagesAgg._sum.pagesRead ?? 0;
  const totalSeconds = durationAgg._sum.duration ?? 0;

  const personalRows: [string, string][] = [
    ["Ism", student.name],
    ["Yosh", student.age?.toString() ?? "—"],
    ["Guruh / sinf", student.group ?? "—"],
    ["Telefon", student.phone ?? "—"],
    ["Email", student.email ?? "—"],
    ["Jins", student.gender === "MALE" ? "Erkak" : student.gender === "FEMALE" ? "Ayol" : "—"],
    ["Manzil", student.address ?? "—"],
    ["Ota-ona kontakti", student.parentContact ?? "—"],
    ["Tizimga qo'shilgan", new Date(student.createdAt).toLocaleDateString("uz-UZ")],
    ["Holat", student.isActive ? "Faol" : "Bloklangan"],
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/students"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Orqaga"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">O&apos;quvchi profili</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Kutubxonadan foydalanishining to&apos;liq ko&apos;rinishi
          </p>
        </div>
      </div>

      {/* Identity card */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
            {student.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={student.avatar} alt={student.name} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <User size={26} className="text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold">{student.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {student.group && (
                <Badge variant="secondary" className="gap-1 text-[11px]">
                  <GraduationCap size={11} /> {student.group}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={`text-[11px] ${
                  student.isActive ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                }`}
              >
                {student.isActive ? "Faol" : "Bloklangan"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-2">
          {personalRows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="shrink-0 text-muted-foreground">{k}</span>
              <span className="truncate text-right font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Library stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Boshlangan kitoblar",
            value: startedCount,
            icon: BookOpen,
            color: "text-blue-600",
          },
          {
            label: "Tugatilgan kitoblar",
            value: completedCount,
            icon: Award,
            color: "text-green-600",
          },
          {
            label: "O'qilgan sahifalar",
            value: totalPages.toLocaleString(),
            icon: ChevronRight,
            color: "text-violet-600",
          },
          {
            label: "Umumiy o'qish vaqti",
            value: formatDuration(totalSeconds),
            icon: Clock,
            color: "text-orange-500",
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/60 ${s.color}`}>
                  <Icon size={15} />
                </span>
              </div>
              <p className="mt-2 text-xl font-bold tabular-nums">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Activity heatmap (30 kun) */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Activity size={15} className="text-primary" />
            Faollik tarixi (30 kun)
          </h3>
          <span className="text-xs text-muted-foreground">{activeDays} kun faol</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {last30.map((d) => (
            <span
              key={d.key}
              title={`${d.date.toLocaleDateString("uz-UZ")}: ${d.count} sessiya`}
              className={`h-4 w-4 rounded-[4px] ${
                d.count === 0
                  ? "bg-muted"
                  : d.count < 2
                    ? "bg-primary/30"
                    : d.count < 4
                      ? "bg-primary/60"
                      : "bg-primary"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current reading / last book */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <BookOpen size={15} className="text-primary" />
              Hozir o&apos;qiyotgan kitob
            </h3>
            {currentReading ? (
              <Link
                href={`/books/${currentReading.book.slug}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3 transition-colors hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{currentReading.book.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentReading.currentPage} sahifa · {Math.round(currentReading.progress)}%
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
              </Link>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Hozircha o&apos;qilayotgan kitob yo&apos;q
              </p>
            )}
            {lastReadBook && lastReadBook.book.id !== currentReading?.book.id && (
              <>
                <p className="mb-2 mt-4 text-xs font-semibold text-muted-foreground">
                  Oxirgi o&apos;qilgan kitob
                </p>
                <Link
                  href={`/books/${lastReadBook.book.slug}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3 transition-colors hover:bg-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{lastReadBook.book.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(lastReadBook.lastReadAt).toLocaleDateString("uz-UZ")}
                    </p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
                </Link>
              </>
            )}
          </div>

          {/* Contact info */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Phone size={15} className="text-primary" />
              Aloqa ma&apos;lumotlari
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Telefon</span>
                <span className="font-medium">{student.phone ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ota-ona</span>
                <span className="font-medium">{student.parentContact ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="shrink-0 text-muted-foreground">Manzil</span>
                <span className="truncate text-right font-medium">{student.address ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent sessions */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <CalendarDays size={15} className="text-primary" />
            Oxirgi o&apos;qish sessiyalari
          </h3>
          {recentSessions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Hali sessiya yo&apos;q
            </p>
          ) : (
            <ol className="space-y-2.5">
              {recentSessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.book?.title ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.startedAt).toLocaleString("uz-UZ", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                    {s.pagesRead} bet
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
