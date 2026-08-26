export const dynamic = "force-dynamic";

import { Target, Clock, CheckCircle, XCircle, Trophy, Coins } from "lucide-react";
import { getSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";

type Mission = {
  id: string;
  name: string;
  description: string;
  target: string;
  startDate: string;
  endDate: string;
  goal: string;
  reward: string;
  penalty: string;
  status: "active" | "completed" | "expired";
  progress: number;
  total: number;
  type: "pages" | "books";
};

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun -> 6
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfWeek(d: Date) {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}
function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfMonth(d: Date) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + 1, 0);
  x.setHours(23, 59, 59, 999);
  return x;
}

export default async function MissionsPage() {
  const sessionUser = await getSessionUser();
  const userId = sessionUser?.id;

  const now = new Date();

  // Define mission templates with real time windows
  const templates: Array<Omit<Mission, "progress" | "status"> & { type: "pages" | "books"; getRange: () => { start: Date; end: Date } }> = [
    {
      id: "1",
      name: "Haftalik 100 sahifa",
      description: "7 kun ichida 100 sahifa o'qing",
      target: "student",
      goal: "100 sahifa",
      reward: "+50 Coin",
      penalty: "—",
      type: "pages",
      total: 100,
      startDate: toISODate(startOfWeek(now)),
      endDate: toISODate(endOfWeek(now)),
      getRange: () => ({ start: startOfWeek(now), end: endOfWeek(now) }),
    },
    {
      id: "2",
      name: "30 sahifa challenge",
      description: "Bir kunda 30 sahifa o'qing",
      target: "student",
      goal: "30 sahifa",
      reward: "+30 Coin",
      penalty: "—",
      type: "pages",
      total: 30,
      startDate: toISODate(startOfDay(now)),
      endDate: toISODate(endOfDay(now)),
      getRange: () => ({ start: startOfDay(now), end: endOfDay(now) }),
    },
    {
      id: "3",
      name: "Birinchi kitobni tugatish",
      description: "Birinchi kitobni to'liq o'qing",
      target: "student",
      goal: "1 kitob",
      reward: "+100 Coin",
      penalty: "—",
      type: "books",
      total: 1,
      startDate: toISODate(startOfMonth(now)),
      endDate: toISODate(endOfMonth(now)),
      getRange: () => ({ start: startOfMonth(now), end: endOfMonth(now) }),
    },
    {
      id: "4",
      name: "O'tgan hafta challenge",
      description: "O'tgan hafta bajarilmagan missiya",
      target: "student",
      goal: "50 sahifa",
      reward: "+25 Coin",
      penalty: "—",
      type: "pages",
      total: 50,
      startDate: toISODate(startOfWeek(new Date(now.getTime() - 7 * 86400000))),
      endDate: toISODate(endOfWeek(new Date(now.getTime() - 7 * 86400000))),
      getRange: () => {
        const lastWeek = new Date(now.getTime() - 7 * 86400000);
        return { start: startOfWeek(lastWeek), end: endOfWeek(lastWeek) };
      },
    },
  ];

  // Compute real progress for each mission if user is logged in
  const missions: Mission[] = await Promise.all(
    templates.map(async (t) => {
      let progress = 0;
      if (userId) {
        const { start, end } = t.getRange();
        if (t.type === "pages") {
          const agg = await prisma.readingSession.aggregate({
            where: { userId, startedAt: { gte: start, lte: end } },
            _sum: { pagesRead: true },
          });
          progress = agg._sum.pagesRead ?? 0;
        } else {
          progress = await prisma.readingProgress.count({
            where: { userId, completedAt: { gte: start, lte: end } },
          });
        }
      }
      // Determine status based on real time
      const endDate = new Date(t.endDate + "T23:59:59");
      let status: Mission["status"] = "active";
      if (progress >= t.total) status = "completed";
      else if (now > endDate) status = "expired";
      return { ...t, progress: Math.min(progress, t.total), status };
    })
  );

  const active = missions.filter((m) => m.status === "active");
  const completed = missions.filter((m) => m.status === "completed");
  const expired = missions.filter((m) => m.status === "expired");

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground">🎯 Missiyalar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Topshiriqlarni bajaring va coin yutib oling — progress real vaqtda hisoblanadi
        </p>
      </div>

      {/* Active Missions */}
      {active.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Faol
          </h2>
          <div className="space-y-3">
            {active.map((m) => {
              const pct = Math.round((m.progress / m.total) * 100);
              return (
                <div key={m.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Target size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{m.name}</h3>
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-primary">{pct}%</span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{m.progress} / {m.total}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-green-600">
                        <Coins size={12} /> {m.reward}
                      </span>
                      <span className="flex items-center gap-1 text-orange-600">
                        <Clock size={12} /> {m.endDate}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle size={14} className="text-green-600" />
            Bajarilgan
          </h2>
          <div className="space-y-2">
            {completed.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30 text-green-600">
                  <CheckCircle size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>
                <span className="text-xs font-medium text-green-600">{m.reward}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expired */}
      {expired.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <XCircle size={14} className="text-red-500" />
            Muddati tugagan
          </h2>
          <div className="space-y-2">
            {expired.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 opacity-60">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30 text-red-500">
                  <XCircle size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.progress}/{m.total} bajarildi • {m.endDate}gacha edi</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
