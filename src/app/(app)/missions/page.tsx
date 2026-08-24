export const dynamic = "force-dynamic";

import { Target, Clock, CheckCircle, XCircle, Trophy, Coins } from "lucide-react";

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
};

const DEMO_MISSIONS: Mission[] = [
  {
    id: "1",
    name: "Haftalik 100 sahifa",
    description: "7 kun ichida 100 sahifa o'qing",
    target: "student",
    startDate: "2026-08-20",
    endDate: "2026-08-27",
    goal: "100 sahifa",
    reward: "+50 Coin",
    penalty: "—",
    status: "active",
    progress: 80,
    total: 100,
  },
  {
    id: "2",
    name: "30 sahifa challenge",
    description: "Bir kunda 30 sahifa o'qing",
    target: "student",
    startDate: "2026-08-24",
    endDate: "2026-08-24",
    goal: "30 sahifa",
    reward: "+30 Coin",
    penalty: "—",
    status: "active",
    progress: 18,
    total: 30,
  },
  {
    id: "3",
    name: "Birinchi kitobni tugatish",
    description: "Birinchi kitobni to'liq o'qing",
    target: "student",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    goal: "1 kitob",
    reward: "+100 Coin",
    penalty: "—",
    status: "completed",
    progress: 1,
    total: 1,
  },
  {
    id: "4",
    name: "O'tgan hafta challenge",
    description: "O'tgan hafta bajarilmagan missiya",
    target: "student",
    startDate: "2026-08-13",
    endDate: "2026-08-20",
    goal: "50 sahifa",
    reward: "+25 Coin",
    penalty: "—",
    status: "expired",
    progress: 20,
    total: 50,
  },
];

export default function MissionsPage() {
  const active = DEMO_MISSIONS.filter((m) => m.status === "active");
  const completed = DEMO_MISSIONS.filter((m) => m.status === "completed");
  const expired = DEMO_MISSIONS.filter((m) => m.status === "expired");

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-0">
      <div>
        <h1 className="text-xl font-bold text-foreground">🎯 Missiyalar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Topshiriqlarni bajaring va coin yutib oling
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
                  <p className="text-xs text-muted-foreground">{m.progress}/{m.total} bajarildi</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
