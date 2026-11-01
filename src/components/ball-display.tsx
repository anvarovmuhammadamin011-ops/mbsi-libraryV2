"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Trophy,
  AlertTriangle,
  History,
} from "lucide-react";

interface BallData {
  balls: number;
  maxBalls: number;
  history: {
    id: string;
    amount: number;
    balance: number;
    type: string;
    description: string | null;
    createdAt: string;
  }[];
}

interface Props {
  initialBalls?: number;
  showDetails?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  BOOK_READ: "Kitob o'qildi",
  MISSION_COMPLETE: "Missiya bajarildi",
  MISSION_PENALTY: "Jarima",
  ADMIN_GIVE: "Admin berdi",
  ADMIN_TAKE: "Admin oldi",
  MANUAL: "Qo'lda",
  INACTIVITY_PENALTY: "Faolsizlik jarimasi",
};

const REWARDS = [
  { label: "Oson missiya", value: "+0.3", color: "text-emerald-600" },
  { label: "O'rtacha missiya", value: "+0.6", color: "text-emerald-600" },
  { label: "Qiyin missiya", value: "+1.0", color: "text-blue-600" },
  { label: "Epik missiya", value: "+1.5", color: "text-violet-600" },
  { label: "Kitob tugatish", value: "+0.02…+0.08", color: "text-emerald-600" },
];

const PENALTIES = [
  { label: "Missiya bajarilmadi", value: "−0.5" },
  { label: "Faolsizlik", value: "−0.5" },
  { label: "Admin jarimasi", value: "−1.0" },
];

export function BallDisplay({ initialBalls = 0 }: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<BallData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !data) loadBalls();
  }, [open]);

  async function loadBalls() {
    setLoading(true);
    try {
      const res = await fetch("/api/balls");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error("Ball load error:", e);
    } finally {
      setLoading(false);
    }
  }

  const balls = data?.balls ?? initialBalls;
  const maxBalls = data?.maxBalls ?? 12;
  const percentage = Math.max(0, Math.min(100, (balls / maxBalls) * 100));

  const totals = useMemo(() => {
    let plus = 0;
    let minus = 0;
    for (const h of data?.history ?? []) {
      if (h.amount > 0) plus += h.amount;
      else minus += h.amount;
    }
    return { plus, minus };
  }, [data]);

  return (
    <>
      {/* ─── Trigger card ─── */}
      <button
        onClick={() => setOpen(true)}
        className="group relative w-full overflow-hidden rounded-2xl border border-amber-500/25 bg-[linear-gradient(120deg,rgba(245,158,11,0.14),rgba(234,88,12,0.08))] px-4 py-3 text-left transition-all hover:border-amber-500/50 hover:shadow-md"
      >
        <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
            <Star size={20} className="fill-amber-500 text-amber-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Joriy ball
            </p>
            <p className="text-lg font-black leading-tight text-amber-700 tabular-nums dark:text-amber-400">
              {balls.toFixed(1)}
              <span className="ml-1 text-xs font-semibold text-muted-foreground">
                / {maxBalls}
              </span>
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-amber-500/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-amber-500/30 bg-background/70 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
            Batafsil
          </span>
        </div>
      </button>

      {/* ─── Details dialog ─── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star size={18} className="fill-amber-500 text-amber-500" />
              Ball hisobi
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Score ring */}
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-muted/30 p-4">
                <div
                  className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#f59e0b ${percentage * 3.6}deg, rgba(148,163,184,0.25) 0deg)`,
                  }}
                >
                  <div className="flex h-[76px] w-[76px] flex-col items-center justify-center rounded-full bg-card">
                    <span className="text-xl font-black tabular-nums text-foreground">
                      {balls.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      / {maxBalls} ball
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2">
                    <span className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                      <TrendingUp size={13} /> To&apos;plangan
                    </span>
                    <span className="text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                      +{totals.plus.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-red-500/10 px-3 py-2">
                    <span className="flex items-center gap-1.5 text-xs text-red-700 dark:text-red-400">
                      <TrendingDown size={13} /> Jarimalar
                    </span>
                    <span className="text-sm font-bold tabular-nums text-red-700 dark:text-red-400">
                      {totals.minus.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rules */}
              <div className="space-y-3">
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-600">
                    <Trophy size={13} /> Ball qo&apos;shiladi
                  </h4>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {REWARDS.map((r) => (
                      <div
                        key={r.label}
                        className="flex items-center justify-between rounded-lg border border-border px-2.5 py-1.5 text-xs"
                      >
                        <span className="text-muted-foreground">{r.label}</span>
                        <span className={`font-bold tabular-nums ${r.color}`}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-600">
                    <AlertTriangle size={13} /> Ball ayiriladi
                  </h4>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {PENALTIES.map((p) => (
                      <div
                        key={p.label}
                        className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1.5 text-xs"
                      >
                        <span className="text-muted-foreground">{p.label}</span>
                        <span className="font-bold tabular-nums text-red-600">{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="flex items-start gap-1.5 rounded-lg bg-muted/50 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
                  <Info size={13} className="mt-0.5 shrink-0 text-primary" />
                  Ball 0 dan {maxBalls} gacha cheklangan. Faqat haqiqiy o&apos;qish va
                  bajarilgan missiyalar hisobga olinadi.
                </p>
              </div>

              {/* History */}
              {data?.history?.length ? (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <History size={13} /> Tarix
                  </h4>
                  <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                    {data.history.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                              h.amount > 0
                                ? "bg-emerald-500/10 text-emerald-600"
                                : h.amount < 0
                                  ? "bg-red-500/10 text-red-600"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {h.amount > 0 ? (
                              <TrendingUp size={12} />
                            ) : h.amount < 0 ? (
                              <TrendingDown size={12} />
                            ) : (
                              <Minus size={12} />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs">
                              {h.description || TYPE_LABELS[h.type] || h.type}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(h.createdAt).toLocaleDateString("uz")} · balans{" "}
                              {h.balance.toFixed(1)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 text-xs font-bold tabular-nums ${
                            h.amount > 0
                              ? "text-emerald-600"
                              : h.amount < 0
                                ? "text-red-600"
                                : "text-muted-foreground"
                          }`}
                        >
                          {h.amount > 0 ? "+" : ""}
                          {h.amount.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  Hozircha tarix yo&apos;q.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
