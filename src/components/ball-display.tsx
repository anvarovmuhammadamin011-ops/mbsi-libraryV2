"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Star, TrendingUp, TrendingDown, Minus } from "lucide-react";

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

export function BallDisplay({ initialBalls = 0, showDetails = true }: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<BallData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !data) {
      loadBalls();
    }
  }, [open]);

  async function loadBalls() {
    setLoading(true);
    try {
      const res = await fetch("/api/balls");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Ball load error:", e);
    } finally {
      setLoading(false);
    }
  }

  const balls = data?.balls ?? initialBalls;
  const maxBalls = data?.maxBalls ?? 12;
  const percentage = (balls / maxBalls) * 100;

  const typeLabels: Record<string, string> = {
    BOOK_READ: "Kitob o'qildi",
    MISSION_COMPLETE: "Missiya bajarildi",
    MISSION_PENALTY: "Jazo",
    ADMIN_GIVE: "Admin berdi",
    ADMIN_TAKE: "Admin oldi",
    MANUAL: "Qo'lda",
  };

  const typeColors: Record<string, string> = {
    BOOK_READ: "text-green-500",
    MISSION_COMPLETE: "text-green-500",
    MISSION_PENALTY: "text-red-500",
    ADMIN_GIVE: "text-blue-500",
    ADMIN_TAKE: "text-orange-500",
    MANUAL: "text-gray-500",
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 px-3 py-2 hover:from-yellow-500/20 hover:to-orange-500/20 transition-all cursor-pointer"
      >
        <div className="relative">
          <Star size={20} className="fill-yellow-500 text-yellow-500" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
        </div>
        <div className="text-left">
          <p className="text-xs text-muted-foreground">Ballar</p>
          <p className="text-sm font-bold text-yellow-600">
            {balls.toFixed(1)} / {maxBalls}
          </p>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star size={18} className="fill-yellow-500 text-yellow-500" />
              Ball tizimi
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Ball meter */}
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Joriy ball</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {balls.toFixed(1)}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">0</span>
                  <span className="text-xs text-muted-foreground">{maxBalls}</span>
                </div>
              </div>

              {/* Info */}
              <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                <h4 className="text-sm font-medium">Qanday ball olish mumkin?</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <TrendingUp size={12} className="text-green-500" />
                    Kitob o'qish: +0.02 ~ +0.08 (kam)
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp size={12} className="text-green-500" />
                    Oson missiya: +0.3 ball
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp size={12} className="text-green-500" />
                    O'rtacha missiya: +0.6 ball
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp size={12} className="text-blue-500" />
                    Qiyin missiya: +1.0 ball
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp size={12} className="text-purple-500" />
                    Epik missiya: +1.5 ball
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingDown size={12} className="text-red-500" />
                    Missiya bajarilmasa: -0.5
                  </li>
                </ul>
              </div>

              {/* History */}
              {data?.history && data.history.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Tarix</h4>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {data.history.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          {h.amount > 0 ? (
                            <TrendingUp size={12} className="text-green-500" />
                          ) : h.amount < 0 ? (
                            <TrendingDown size={12} className="text-red-500" />
                          ) : (
                            <Minus size={12} className="text-gray-500" />
                          )}
                          <div>
                            <p className="text-xs">{h.description || typeLabels[h.type]}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(h.createdAt).toLocaleDateString("uz")}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-medium ${typeColors[h.type] || "text-muted-foreground"}`}
                        >
                          {h.amount > 0 ? "+" : ""}
                          {h.amount.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
