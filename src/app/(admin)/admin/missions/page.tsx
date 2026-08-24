export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { Target, Plus, Trophy, Coins, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  status: string;
  completedBy: number;
};

export default async function MissionsPage() {
  const totalStudents = await prisma.user.count({ where: { role: "STUDENT" } });

  const missions: Mission[] = [
    {
      id: "1",
      name: "Haftalik kitob topshirig'i",
      description: "Har bir o'quvchi haftada kamida 1 ta kitobni 50 sahifasini o'qishi kerak",
      target: "Student",
      startDate: "2026-08-25",
      endDate: "2026-09-01",
      goal: "50 sahifa",
      reward: "+50 coin",
      penalty: "—",
      status: "active",
      completedBy: 120,
    },
    {
      id: "2",
      name: "O'qituvchi missiyasi — Diagnostic",
      description: "Har bir o'qituvchi o'z fanidan kamida 1 ta kitobni tugatishi kerak",
      target: "Teacher",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      goal: "1 kitob",
      reward: "Yaxshi KPI",
      penalty: "50 000 so'm",
      status: "upcoming",
      completedBy: 0,
    },
    {
      id: "3",
      name: "Eng ko'p o'quvchi",
      description: "Oy yakunida eng ko'p sahifa o'qigan o'quvchi +200 coin oladi",
      target: "Student",
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      goal: "Eng ko'p sahifa",
      reward: "+200 coin",
      penalty: "—",
      status: "active",
      completedBy: 1,
    },
    {
      id: "4",
      name: "Yillik reading challenge",
      description: "1 yil davomida 50 ta kitob tugatish",
      target: "Student",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      goal: "50 kitob",
      reward: "+500 coin + sertifikat",
      penalty: "—",
      status: "active",
      completedBy: 12,
    },
  ];

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    expired: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const statusLabels: Record<string, string> = {
    active: "Faol",
    upcoming: "Kelayotgan",
    completed: "Tugallangan",
    expired: "Muddati tugagan",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Missiyalar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            O&apos;quvchilar va o&apos;qituvchilar uchun missiyalar yarating
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus size={16} />
          Yangi missiya
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Jami missiyalar", value: missions.length, icon: <Target size={18} />, color: "text-primary" },
          { label: "Faol", value: missions.filter((m) => m.status === "active").length, icon: <Trophy size={18} />, color: "text-green-600" },
          { label: "Bajarilgan", value: missions.reduce((sum, m) => sum + m.completedBy, 0), icon: <Coins size={18} />, color: "text-yellow-600" },
          { label: "Jazo riski", value: missions.filter((m) => m.penalty !== "—").length, icon: <AlertTriangle size={18} />, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <span className={s.color}>{s.icon}</span>
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            </div>
            <p className={`text-2xl font-bold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Missions Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {missions.map((m) => (
          <div key={m.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Target size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{m.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {m.target === "Student" ? "👨‍🎓 O'quvchilar" : "👨‍🏫 O'qituvchilar"}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[m.status]}`}>
                {statusLabels[m.status]}
              </span>
            </div>

            <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{m.description}</p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Boshlanish</p>
                <p className="font-medium text-foreground">{m.startDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tugash</p>
                <p className="font-medium text-foreground">{m.endDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Maqsad</p>
                <p className="font-medium text-foreground">{m.goal}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Mukofot</p>
                <p className="font-medium text-green-600">{m.reward}</p>
              </div>
            </div>

            {m.penalty !== "—" && (
              <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/20 p-2.5">
                <p className="text-xs text-red-600 font-medium">
                  ⚠️ Jarima: {m.penalty}
                </p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {m.completedBy} / {totalStudents} bajarildi
              </p>
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  Tahrirlash
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive">
                  O&apos;chirish
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
