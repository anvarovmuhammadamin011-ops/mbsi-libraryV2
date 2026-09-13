"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "@/lib/api-client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  PlayCircle,
  BookCheck,
  Flame,
  Clock,
  CalendarCheck,
} from "lucide-react";

type Result = {
  sessions: number;
  pagesRead: number;
  readingSeconds: number;
  activeDays: number;
  booksCompleted: number;
};

const PERIODS = [
  { value: "today", label: "Bugun" },
  { value: "yesterday", label: "Kecha" },
  { value: "7d", label: "Oxirgi 7 kun" },
  { value: "30d", label: "Oxirgi 30 kun" },
  { value: "custom", label: "Maxsus davr" },
];

function fmt(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function AdminUserActivity({ userId }: { userId: string }) {
  const [period, setPeriod] = useState("30d");
  const [customFrom, setCustomFrom] = useState(fmt(new Date(Date.now() - 29 * 86400000)));
  const [customTo, setCustomTo] = useState(fmt(new Date()));
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);

  const today = fmt(new Date());
  const yesterday = fmt(new Date(Date.now() - 86400000));
  const weekAgo = fmt(new Date(Date.now() - 6 * 86400000));
  const monthAgo = fmt(new Date(Date.now() - 29 * 86400000));

  const from =
    period === "today"
      ? today
      : period === "yesterday"
        ? yesterday
        : period === "7d"
          ? weekAgo
          : period === "custom"
            ? customFrom
            : monthAgo;
  const to = period === "custom" ? customTo : period === "yesterday" ? yesterday : today;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get<Result>(`/api/admin/users/${userId}/activity?from=${from}&to=${to}`)
      .then((r) => {
        if (alive) setResult(r);
      })
      .catch(() => {
        if (alive) setResult(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [from, to, userId]);

  const fmtDur = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    return h > 0 ? `${h} soat ${m} daq` : `${m} daq`;
  };

  const cards: { label: string; value: string; icon: ReactNode }[] = result
    ? [
        { label: "O'qish sessiyalari", value: String(result.sessions), icon: <PlayCircle size={15} /> },
        { label: "O'qilgan sahifalar", value: result.pagesRead.toLocaleString(), icon: <Flame size={15} /> },
        { label: "O'qish vaqti", value: fmtDur(result.readingSeconds), icon: <Clock size={15} /> },
        { label: "Faol kunlar", value: String(result.activeDays), icon: <CalendarCheck size={15} /> },
        { label: "Tugatilgan kitoblar", value: String(result.booksCompleted), icon: <BookCheck size={15} /> },
      ]
    : [];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <CalendarCheck size={15} className="text-primary" /> Davr bo&apos;yicha faollik
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tanlangan davrdagi o&apos;qish faolligi
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Davr</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v ?? "30d")}>
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {period === "custom" && (
            <>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Boshlanishi</Label>
                <Input
                  type="date"
                  className="h-9 w-40 text-sm"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Tugashi</Label>
                <Input
                  type="date"
                  className="h-9 w-40 text-sm"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Hisoblanmoqda...
        </div>
      ) : result ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {cards.map((x) => (
            <div key={x.label} className="rounded-xl border border-border p-3">
              <div className="mb-1 flex items-center text-muted-foreground">{x.icon}</div>
              <p className="text-lg font-bold tabular-nums">{x.value}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{x.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">Ma&apos;lumot topilmadi</p>
      )}
    </div>
  );
}