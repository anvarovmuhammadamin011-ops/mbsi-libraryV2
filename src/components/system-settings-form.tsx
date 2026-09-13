"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Swords, Activity, Briefcase, Settings2, Info } from "lucide-react";
import type { SystemSettings } from "@/types";

const INPUT = "h-10";

export function SystemSettingsForm() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<SystemSettings>("/api/admin/system-settings")
      .then(setSettings)
      .catch((e: any) => toast.error(e.message ?? "Sozlamalar olinmadi"));
  }, []);

  const set = (k: keyof SystemSettings, v: number | boolean) =>
    setSettings((s) => (s ? { ...s, [k]: v } : s));

  async function save() {
    if (!settings) return;
    setBusy(true);
    try {
      const next = await api.patch<SystemSettings>("/api/admin/system-settings", {
        minPagesPerRead: settings.minPagesPerRead,
        minSecondsPerRead: settings.minSecondsPerRead,
        battleStartPoints: settings.battleStartPoints,
        battleProgressPoints: settings.battleProgressPoints,
        battleCompletePoints: settings.battleCompletePoints,
        staffCanAccessApp: settings.staffCanAccessApp,
      });
      setSettings(next);
      toast.success("Sozlamalar saqlandi");
    } catch (e: any) {
      toast.error(e.message ?? "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  if (!settings) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity size={16} className="text-primary" />
          <h2 className="text-sm font-semibold">Faollik o&apos;lchami — &quot;haqiqiy o&apos;qish&quot; mezonlari</h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Kitob ochib qo&apos;yish bilan ochko yig&apos;ib bo&apos;lmaydi. Quyidagi chegaradan o&apos;tgan
          sessiyalar&nbsp;gina o&apos;qish va battle hisobiga kiritiladi.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Minimal sahifalar (bitta sessiyada)"
            value={settings.minPagesPerRead}
            onChange={(v) => set("minPagesPerRead", v)}
          />
          <NumberField
            label="Minimal vaqt, soniya"
            value={settings.minSecondsPerRead}
            onChange={(v) => set("minSecondsPerRead", v)}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Swords size={16} className="text-primary" />
          <h2 className="text-sm font-semibold">Battle ochko qoidalari</h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          O&apos;quvchilar/O&apos;qituvchilar battle&apos;ida bir kitob uchun beriladigan ochkolar.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            label="Boshlash ochkosi"
            value={settings.battleStartPoints}
            onChange={(v) => set("battleStartPoints", v)}
          />
          <NumberField
            label="50% o&apos;qish ochkosi"
            value={settings.battleProgressPoints}
            onChange={(v) => set("battleProgressPoints", v)}
          />
          <NumberField
            label="Tugatish ochkosi"
            value={settings.battleCompletePoints}
            onChange={(v) => set("battleCompletePoints", v)}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Briefcase size={16} className="text-primary" />
          <h2 className="text-sm font-semibold">Xodimlar va ilovaga kirish</h2>
        </div>
        <ToggleRow
          label="Xodimlar ilovaga kira oladi"
          desc="Xodimlar (Kitob menejeri, Direktor va b.) ilovadan foydalanishi mumkin."
          checked={settings.staffCanAccessApp}
          onChange={(v) => set("staffCanAccessApp", v)}
        />
      </div>

      <Card className="flex items-start gap-3 p-4">
        <Info size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Quyidagi sozlamalar hozircha sozlanmaydi:{" "}
          <strong className="text-foreground">bir vaqtda faol kitoblar soni</strong> —{" "}
          {settings.maxActiveBooks} ta.
        </p>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={busy} className="gap-2">
          <Settings2 size={15} /> {busy ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        className={INPUT}
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <input
        type="checkbox"
        className="mt-0.5 h-5 w-10 appearance-none rounded-full border border-input bg-muted transition-colors checked:bg-primary relative checked:after:translate-x-5 after:absolute after:top-0.5 after:start-0.5 after:h-4 after:w-4 after:rounded-full after:bg-background after:shadow-sm after:transition-transform"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}