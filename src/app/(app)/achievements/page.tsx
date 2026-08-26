import {
  Trophy,
  Flame,
  BookOpen,
  Target,
  Star,
  Clock,
  Medal,
  Lock,
  Crown,
  Zap,
  Heart,
  Award,
  CheckCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  total?: number;
  color: string;
  bgColor: string;
};

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "1",
    name: "Birinchi kitob",
    description: "Birinchi kitobni to'liq o'qing",
    icon: <BookOpen size={20} />,
    category: "Reading",
    unlocked: true,
    unlockedAt: "2026-08-15",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    id: "2",
    name: "7 kunlik streak",
    description: "7 kun ketma-ket o'qing",
    icon: <Flame size={20} />,
    category: "Streak",
    unlocked: true,
    unlockedAt: "2026-08-20",
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
  },
  {
    id: "3",
    name: "1000 sahifa",
    description: "1000 sahifa o'qing",
    icon: <Target size={20} />,
    category: "Pages",
    unlocked: true,
    unlockedAt: "2026-08-22",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  {
    id: "4",
    name: "Kitobxon",
    description: "10 ta kitob tugating",
    icon: <Award size={20} />,
    category: "Reading",
    unlocked: false,
    progress: 4,
    total: 10,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    id: "5",
    name: "Missiya ustasi",
    description: "20 ta missiyani bajaring",
    icon: <Target size={20} />,
    category: "Missions",
    unlocked: false,
    progress: 7,
    total: 20,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
  },
  {
    id: "6",
    name: "30 kunlik streak",
    description: "30 kun ketma-ket o'qing",
    icon: <Flame size={20} />,
    category: "Streak",
    unlocked: false,
    progress: 12,
    total: 30,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
  {
    id: "7",
    name: "Ijtimoiy o'quvchi",
    description: "5 ta kitobni tavsiya qiling",
    icon: <Heart size={20} />,
    category: "Social",
    unlocked: false,
    progress: 2,
    total: 5,
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
  },
  {
    id: "8",
    name: "Tezkor o'quvchi",
    description: "Bir kunda 50 sahifa o'qing",
    icon: <Zap size={20} />,
    category: "Speed",
    unlocked: false,
    progress: 32,
    total: 50,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    id: "9",
    name: "Chempion",
    description: "Reytingda 1-o'ringa chiqing",
    icon: <Crown size={20} />,
    category: "Ranking",
    unlocked: false,
    progress: 17,
    total: 1,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
  },
  {
    id: "10",
    name: "Barcha kategoriyalar",
    description: "Har bir kategoriyadan 1 kitob o'qing",
    icon: <Medal size={20} />,
    category: "Variety",
    unlocked: false,
    progress: 3,
    total: 6,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
  },
];

export default function AchievementsPage() {
  const unlocked = ACHIEVEMENTS.filter((a) => a.unlocked);
  const locked = ACHIEVEMENTS.filter((a) => !a.unlocked);

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground">🏅 Yutuqlar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          O'qish yutuqlaringizni kuzating
        </p>
      </div>

      {/* Progress summary */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-foreground">Yutuqlar progressi</p>
          <span className="text-sm font-bold text-primary">
            {unlocked.length}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.round((unlocked.length / ACHIEVEMENTS.length) * 100)}%` }}
          />
        </div>
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle size={14} className="text-green-600" />
            Olingan ({unlocked.length})
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {unlocked.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-border bg-card p-4 text-center"
              >
                <div
                  className={`flex h-12 w-12 mx-auto items-center justify-center rounded-2xl ${a.bgColor} ${a.color} mb-3`}
                >
                  {a.icon}
                </div>
                <h3 className="text-sm font-semibold text-foreground">{a.name}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{a.description}</p>
                {a.unlockedAt && (
                  <p className="text-[10px] text-green-600 mt-2 font-medium">
                    ✓ {a.unlockedAt}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Lock size={14} className="text-muted-foreground" />
            Hali olinmagan ({locked.length})
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {locked.map((a) => {
              const pct = a.progress && a.total
                ? Math.round((a.progress / a.total) * 100)
                : 0;
              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-border bg-card p-4 text-center opacity-60"
                >
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3 relative">
                    {a.icon}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock size={12} className="text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{a.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{a.description}</p>
                  {a.progress !== undefined && a.total !== undefined && (
                    <div className="mt-2">
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {a.progress}/{a.total}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
