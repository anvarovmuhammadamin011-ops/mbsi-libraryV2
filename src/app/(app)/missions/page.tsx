"use client";

import { useEffect, useState } from "react";
import { Target, Clock, CheckCircle, XCircle, Trophy, Coins, Gift, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

type Mission = {
  id: string;
  title: string;
  description: string | null;
  targetType: string;
  target: number;
  reward: number;
  difficulty: string;
  ballReward: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  progress: number;
  claimed: boolean;
  status: "active" | "completed" | "claimable" | "expired";
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  EASY: { label: "Oson", color: "text-green-600", bg: "bg-green-100 dark:bg-green-950/30" },
  MEDIUM: { label: "O'rtacha", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950/30" },
  HARD: { label: "Qiyin", color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-950/30" },
  EPIC: { label: "Epik", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-950/30" },
};

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res: any = await api.get("/api/missions");
      setMissions(res.data ?? res ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const claim = async (id: string) => {
    try {
      const res: any = await api.post(`/api/missions/${id}/claim`, {});
      toast.success(`Tabriklaymiz! +${res.data?.reward ?? 10} coin olindi! Rank ko'tarildi!`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) return <div className="p-6 text-center text-sm text-muted-foreground">Yuklanmoqda...</div>;

  const active = missions.filter((m) => m.status === "active");
  const claimable = missions.filter((m) => m.status === "claimable");
  const completed = missions.filter((m) => m.status === "completed");
  const expired = missions.filter((m) => m.status === "expired");

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground">🎯 Missiyalar</h1>
        <p className="text-sm text-muted-foreground mt-1">Admin bergan topshiriqlarni bajaring, coin oling va reytingni ko'taring</p>
      </div>

      {claimable.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Gift size={14} className="text-amber-500" /> Topshirish mumkin
          </h2>
          <div className="space-y-3">
            {claimable.map((m) => {
              const pct = 100;
              return (
                <div key={m.id} className="rounded-2xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                        <Trophy size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{m.title}</h3>
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_CONFIG[m.difficulty]?.bg ?? ''} ${DIFFICULTY_CONFIG[m.difficulty]?.color ?? ''}`}>
                        {DIFFICULTY_CONFIG[m.difficulty]?.label ?? m.difficulty}
                      </span>
                      <span className="text-sm font-bold text-amber-600">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-amber-100 dark:bg-amber-950 overflow-hidden mb-3">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                        <Coins size={12} /> +{m.reward} coin
                      </span>
                      <span className="flex items-center gap-1 text-xs font-medium text-yellow-600">
                        <Star size={12} /> +{m.ballReward} ball
                      </span>
                    </div>
                    <Button size="sm" onClick={() => claim(m.id)} className="bg-amber-500 hover:bg-amber-600 text-white">
                      Topshirish
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {active.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Faol
          </h2>
          <div className="space-y-3">
            {active.map((m) => {
              const pct = Math.round((m.progress / m.target) * 100);
              return (
                <div key={m.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Target size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{m.title}</h3>
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_CONFIG[m.difficulty]?.bg ?? ''} ${DIFFICULTY_CONFIG[m.difficulty]?.color ?? ''}`}>
                        {DIFFICULTY_CONFIG[m.difficulty]?.label ?? m.difficulty}
                      </span>
                      <span className="text-sm font-bold text-primary">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden mb-3">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {m.progress} / {m.target} {m.targetType === "PAGES" ? "sahifa" : "kitob"}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-green-600">
                          <Coins size={12} /> +{m.reward} coin
                        </span>
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Star size={12} /> +{m.ballReward} ball
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-orange-600">
                        <Clock size={12} /> {new Date(m.endDate).toLocaleDateString("uz-UZ")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  <p className="text-sm font-medium text-foreground">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>
                <span className="text-xs font-medium text-green-600">+{m.reward} coin +{m.ballReward} ball</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <p className="text-sm font-medium text-foreground">{m.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.progress}/{m.target} bajarildi • {new Date(m.endDate).toLocaleDateString("uz-UZ")} gacha edi
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {missions.length === 0 && (
        <div className="text-center py-10">
          <Target size={32} className="mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">Hozircha missiyalar yo'q. Admin tez orada yangi vazifalar beradi.</p>
        </div>
      )}
    </div>
  );
}
