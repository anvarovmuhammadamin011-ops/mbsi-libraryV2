import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/server/auth";
import { BookOpen, Clock, CalendarDays } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const sessionUser = await getSessionUser();
  const userId = sessionUser?.id;

  // Get reading sessions grouped by date
  const sessions = userId
    ? await prisma.readingSession.findMany({
        where: { userId },
        include: { book: { select: { title: true, slug: true } } },
        orderBy: { startedAt: "desc" },
        take: 50,
      })
    : [];

  // Group sessions by date
  const grouped: Record<string, typeof sessions> = {};
  for (const s of sessions) {
    const dateKey = new Date(s.startedAt).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(s);
  }

  const totalSessions = sessions.length;
  const totalPages = sessions.reduce((sum, s) => sum + s.pagesRead, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground">🕘 O&apos;qish tarixi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          O&apos;qish faoliyatingizning to&apos;liq tarixi
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={14} className="text-primary" />
            <span className="text-xs text-muted-foreground">Jami sessiyalar</span>
          </div>
          <p className="text-xl font-bold text-foreground">{totalSessions}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-green-600" />
            <span className="text-xs text-muted-foreground">Jami sahifalar</span>
          </div>
          <p className="text-xl font-bold text-foreground">{totalPages}</p>
        </div>
      </div>

      {/* History list */}
      {Object.keys(grouped).length > 0 ? (
        Object.entries(grouped).map(([date, daySessions]) => (
          <div key={date}>
            <h2 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              {date}
            </h2>
            <div className="space-y-2">
              {daySessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/reader/${s.book.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {s.book.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{s.pagesRead} sahifa</span>
                      <span>·</span>
                      <span>{s.startPage}→{s.endPage}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(s.startedAt).toLocaleTimeString("uz-UZ", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {Math.round(s.duration / 60)} daq
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <Clock size={24} className="text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Hali o&apos;qish tarixi yo&apos;q
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Birinchi kitobni oching va o&apos;qishni boshlang!
          </p>
        </div>
      )}
    </div>
  );
}
