"use client";

import { useEffect, useState } from "react";
import { Target, Plus, Coins, Trash2, Pencil, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

type Mission = {
  id: string;
  title: string;
  description: string | null;
  targetType: string;
  target: number;
  reward: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

export default function AdminMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    targetType: "PAGES",
    target: 50,
    reward: 20,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });
  const [editing, setEditing] = useState<Mission | null>(null);

  const load = async () => {
    try {
      const res: any = await api.get("/api/admin/missions");
      setMissions(res.data ?? res ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.title.trim() || !form.target || !form.reward) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }
    try {
      if (editing) {
        await api.patch(`/api/admin/missions/${editing.id}`, form);
        toast.success("Yangilandi");
      } else {
        await api.post("/api/admin/missions", form);
        toast.success("Missiya yaratildi — o'quvchilar coin oladi");
      }
      setForm({ title: "", description: "", targetType: "PAGES", target: 50, reward: 20, startDate: new Date().toISOString().slice(0,10), endDate: new Date(Date.now()+7*86400000).toISOString().slice(0,10) });
      setShowForm(false);
      setEditing(null);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const del = async (id: string) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/api/admin/missions/${id}`);
      toast.success("O'chirildi");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const startEdit = (m: Mission) => {
    setEditing(m);
    setForm({
      title: m.title,
      description: m.description ?? "",
      targetType: m.targetType,
      target: m.target,
      reward: m.reward,
      startDate: m.startDate.slice(0,10),
      endDate: m.endDate.slice(0,10),
    });
    setShowForm(true);
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Missiyalar</h1>
          <p className="text-sm text-muted-foreground mt-1">Admin bergan vazifalar — bajarilsa coin va rank ko'tariladi</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(!showForm); }} className="gap-2">
          <Plus size={16} /> {showForm ? "Yopish" : "Yangi missiya"}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold">{editing ? "Tahrirlash" : "Yangi missiya"}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1">
              <Label>Sarlavha</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Masalan: Haftalik 100 sahifa" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label>Tavsif</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Qisqacha tavsif" rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Turi</Label>
              <select value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })} className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm">
                <option value="PAGES">Sahifalar (PAGES)</option>
                <option value="BOOKS">Kitoblar (BOOKS)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Maqsad (target)</Label>
              <Input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label>Mukofot (coin)</Label>
              <Input type="number" value={form.reward} onChange={(e) => setForm({ ...form, reward: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label>Boshlanish</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Tugash</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <Button onClick={submit} className="w-full sm:w-auto">{editing ? "Saqlash" : "Yaratish"}</Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {missions.map((m) => (
          <div key={m.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Target size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">{m.title}</h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar size={10} /> {m.startDate.slice(0,10)} → {m.endDate.slice(0,10)}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${m.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{m.isActive ? "Faol" : "Nofaol"}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{m.description}</p>
            <div className="grid grid-cols-3 gap-2 text-xs mb-4">
              <div className="rounded-lg bg-muted p-2 text-center"><p className="text-muted-foreground">Maqsad</p><p className="font-bold">{m.target} {m.targetType === "PAGES" ? "sahifa" : "kitob"}</p></div>
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 p-2 text-center"><p className="text-muted-foreground">Mukofot</p><p className="font-bold text-yellow-600 flex items-center justify-center gap-1"><Coins size={12} />{m.reward}</p></div>
              <div className="rounded-lg bg-muted p-2 text-center"><p className="text-muted-foreground">Turi</p><p className="font-bold">{m.targetType}</p></div>
            </div>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => startEdit(m)}><Pencil size={12} /> Tahrirlash</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={() => del(m.id)}><Trash2 size={12} /> O'chirish</Button>
            </div>
          </div>
        ))}
      </div>

      {missions.length === 0 && (
        <div className="text-center py-10">
          <Target size={32} className="mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">Hali missiyalar yo'q. Birinchi missiyani yarating.</p>
        </div>
      )}
    </div>
  );
}
