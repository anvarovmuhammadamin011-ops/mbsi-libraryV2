"use client";

import { useEffect, useState } from "react";
import { Target, Clock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

type Goal = {
  id: string;
  type: string;
  target: number;
  progress: { current: number; target: number; percent: number };
};

export function ReadingGoalCard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newType, setNewType] = useState<"BOOKS_PER_MONTH" | "MINUTES_PER_DAY">("BOOKS_PER_MONTH");
  const [newTarget, setNewTarget] = useState(5);

  const load = async () => {
    try {
      const res: any = await api.get("/api/reading-goals");
      setGoals(res.data ?? res ?? []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      await api.post("/api/reading-goals", { type: newType, target: Number(newTarget) });
      toast.success("Maqsad saqlandi");
      load();
    } catch (e: any) { toast.error(e.message); }
  };
  const remove = async (type: string) => {
    try {
      await api.delete(`/api/reading-goals?type=${type}`);
      toast.success("O'chirildi");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  if (loading) return <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Target size={16} className="text-primary" />
        <h3 className="text-sm font-semibold">📖 Personal Reading Plan</h3>
      </div>

      {goals.length > 0 ? (
        <div className="space-y-3">
          {goals.map((g) => (
            <div key={g.type} className="rounded-xl bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2">
                  {g.type === "BOOKS_PER_MONTH" ? <Target size={14} /> : <Clock size={14} />}
                  {g.type === "BOOKS_PER_MONTH" ? `${g.target} books / month` : `${g.target} minutes / day`}
                </p>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => remove(g.type)}>
                  <Trash2 size={12} />
                </Button>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>{g.progress.current} / {g.progress.target}</span>
                  <span>{g.progress.percent}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" role="progressbar" aria-valuenow={g.progress.percent} aria-valuemin={0} aria-valuemax={100} style={{ width: `${g.progress.percent}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{g.progress.percent >= 100 ? "🎉 Maqsad bajarildi!" : "Davom eting..."}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Hali maqsad belgilanmagan</p>
      )}

      <div className="flex gap-2 items-end border-t pt-3">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Maqsad turi</label>
          <select value={newType} onChange={(e) => setNewType(e.target.value as any)} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm">
            <option value="BOOKS_PER_MONTH">📚 5 books / month</option>
            <option value="MINUTES_PER_DAY">📖 20 minutes / day</option>
          </select>
        </div>
        <div className="w-24">
          <label className="text-xs text-muted-foreground">Target</label>
          <Input type="number" min={1} max={100} value={newTarget} onChange={(e) => setNewTarget(Number(e.target.value))} className="mt-1 h-9" />
        </div>
        <Button onClick={create} className="h-9 gap-1"><Plus size={14} /> Qo'shish</Button>
      </div>
      <p className="text-[11px] text-muted-foreground/70">Masalan: 5 kitob / oy</p>
    </div>
  );
}
