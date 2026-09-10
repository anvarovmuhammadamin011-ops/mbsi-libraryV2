"use client";

// ============================================================
// Admin Diagnostics Dashboard
// Charts: completion donut, reading funnel, session scatter,
// category radar, category trend lines, cohort retention grid,
// activity heatmap, user segment pie, upload health line,
// zero-result searches table.
// ============================================================

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from "recharts";
import {
  CheckCircle,
  Filter,
  Timer,
  LayoutGrid,
  TrendingUp,
  RefreshCw,
  Flame,
  Users,
  Activity,
  Search,
} from "lucide-react";
import type { DiagnosticsData } from "@/lib/server/diagnostics";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const CARD =
  "rounded-2xl border border-border bg-card p-5";

function ChartTitle({
  title,
  sub,
  icon,
}: {
  title: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon && <span className="text-primary">{icon}</span>}
        {title}
      </h2>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "var(--popover, #fff)",
  border: "1px solid var(--border, #e5e7eb)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--popover-foreground, #111)",
};

// ─── A1. Completion donut ────────────────────────────────────
export function CompletionDonut({ data }: { data: DiagnosticsData["completion"] }) {
  const pie = [
    { name: "Tugatilgan", value: data.totalCompleted },
    { name: "Jarayonda", value: data.inProgress },
    { name: "Tashlab ketilgan", value: data.abandoned },
  ].filter((d) => d.value > 0);

  return (
    <div className={CARD}>
      <ChartTitle
        title="Tugatish darajasi"
        icon={<CheckCircle size={15} />}
        sub={`${data.totalStarted} kitob boshlangan · ${data.completionRate}% tugatilgan`}
      />
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pie}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            >
              {pie.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── A2. Reading funnel ──────────────────────────────────────
export function ReadingFunnel({ data }: { data: DiagnosticsData["funnel"] }) {
  return (
    <div className={CARD}>
      <ChartTitle title="O'qish voronkasi" icon={<Filter size={15} />} sub="Tashrif → Boshlash → 50% → Tugatish" />
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="label"
              width={110}
              tick={{ fontSize: 11 }}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" name="Foydalanuvchilar" fill="#3b82f6" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── A3. Session scatter ─────────────────────────────────────
export function SessionScatter({ data }: { data: DiagnosticsData["sessionScatter"] }) {
  return (
    <div className={CARD}>
      <ChartTitle
        title="Seans davomiyligi va sahifalar"
        icon={<Timer size={15} />}
        sub={`O'rtacha seans · so'nggi ${data.length} sessiya`}
      />
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ left: -10, right: 10, top: 6 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              type="number"
              dataKey="durationMin"
              name="Daqiqa"
              tick={{ fontSize: 11 }}
              unit=" d"
            />
            <YAxis type="number" dataKey="pages" name="Sahifa" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Scatter data={data} fill="#8b5cf6" fillOpacity={0.55} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── B1. Category radar ──────────────────────────────────────
export function CategoryRadar({ data }: { data: DiagnosticsData["categoryBalance"] }) {
  return (
    <div className={CARD}>
      <ChartTitle
        title="Kategoriya balansi"
        icon={<LayoutGrid size={15} />}
        sub="Kitoblar soni va o'qilish talabi (reads/kitob)"
      />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
            <PolarRadiusAxis tick={{ fontSize: 9 }} />
            <Radar name="Kitoblar" dataKey="books" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.35} />
            <Radar name="O'qilishlar" dataKey="reads" stroke="#10b981" fill="#10b981" fillOpacity={0.35} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── B2. Category trends ─────────────────────────────────────
export function CategoryTrends({ data }: { data: DiagnosticsData["categoryTrends"] }) {
  const cats = data.length > 0 ? Object.keys(data[0]).filter((k) => k !== "month") : [];
  const palette: Record<string, string> = {};
  cats.forEach((c, i) => (palette[c] = COLORS[i % COLORS.length]));

  return (
    <div className={CARD}>
      <ChartTitle title="Kategoriya trendlari" icon={<TrendingUp size={15} />} sub="Oxirgi 7 oy · eng mashhur 4 kategoriya" />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -18, right: 10, top: 6 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {cats.map((c) => (
              <Line
                key={c}
                type="monotone"
                dataKey={c}
                stroke={palette[c]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── C1. Cohort retention grid ───────────────────────────────
export function CohortRetention({ data }: { data: DiagnosticsData["cohortRetention"] }) {
  function cellColor(v: number) {
    if (v === 0) return "bg-muted/40 text-muted-foreground";
    if (v < 25) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";
    if (v < 50) return "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200";
    if (v < 75) return "bg-emerald-400 text-white dark:bg-emerald-700 dark:text-white";
    return "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white";
  }

  return (
    <div className={CARD}>
      <ChartTitle
        title="Kohort retention"
        icon={<RefreshCw size={15} />}
        sub="Oylik kohortlar bo'yicha qaytish ko'rsatkichlari"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left py-2 pr-3 font-medium">Kohort</th>
              <th className="text-right py-2 px-3 font-medium">O'quvchilar</th>
              <th className="text-center py-2 px-2 font-medium">1-hafta</th>
              <th className="text-center py-2 px-2 font-medium">2-hafta</th>
              <th className="text-center py-2 px-2 font-medium">1-oy</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.cohort} className="border-t border-border/60">
                <td className="py-2 pr-3 font-medium">{r.cohort}</td>
                <td className="py-2 px-3 text-right">{r.size}</td>
                <td className="py-2 px-1">
                  <div className={`rounded-md py-1 text-center font-semibold ${cellColor(r.w1)}`}>
                    {r.w1}%
                  </div>
                </td>
                <td className="py-2 px-1">
                  <div className={`rounded-md py-1 text-center font-semibold ${cellColor(r.w2)}`}>
                    {r.w2}%
                  </div>
                </td>
                <td className="py-2 px-1">
                  <div className={`rounded-md py-1 text-center font-semibold ${cellColor(r.m1)}`}>
                    {r.m1}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── C2. Activity heatmap ────────────────────────────────────
const DAY_NAMES = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

export function ActivityHeatmap({ data }: { data: DiagnosticsData["heatmap"] }) {
  const max = Math.max(1, ...data.map((c) => c.value));

  function shade(v: number) {
    if (v === 0) return "bg-muted/40";
    const t = v / max;
    if (t < 0.25) return "bg-primary/15";
    if (t < 0.5) return "bg-primary/35";
    if (t < 0.75) return "bg-primary/60";
    return "bg-primary";
  }

  return (
    <div className={CARD}>
      <ChartTitle
        title="Aktivlik issiqlik xaritasi"
        icon={<Flame size={15} />}
        sub="Hafta kunlari × soatlar · oxirgi 90 kun"
      />
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="flex">
            <div className="w-8" />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground">
                {h % 3 === 0 ? h : ""}
              </div>
            ))}
          </div>
          {DAY_NAMES.map((dn, di) => (
            <div key={dn} className="flex items-center">
              <div className="w-8 text-[10px] text-muted-foreground">{dn}</div>
              {Array.from({ length: 24 }, (_, h) => {
                const cell = data.find((c) => c.day === di && c.hour === h);
                return (
                  <div key={h} className="flex-1 p-[1px]" title={`${dn} ${h}:00 — ${cell?.value ?? 0}`}>
                    <div className={`aspect-square rounded-[3px] ${shade(cell?.value ?? 0)}`} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── C3. User segments pie ───────────────────────────────────
export function UserSegments({ data }: { data: DiagnosticsData["userSegments"] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className={CARD}>
      <ChartTitle title="Foydalanuvchi segmentatsiyasi" icon={<Users size={15} />} sub={`Jami ${total} foydalanuvchi`} />
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} label={false}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── D1. Upload health line ──────────────────────────────────
export function UploadHealth({ data }: { data: DiagnosticsData["uploadHealth"] }) {
  return (
    <div className={CARD}>
      <ChartTitle
        title="Tizim holati"
        icon={<Activity size={15} />}
        sub="Kitob yuklanishlari va qayta ishlash xatolari · 30 kun"
      />
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -18, right: 10, top: 6 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="uploads" name="Yuklangan" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="errors" name="Xatolar" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── D2. Zero-result searches ────────────────────────────────
export function ZeroResultSearches({ data }: { data: DiagnosticsData["zeroResultSearches"] }) {
  return (
    <div className={CARD}>
      <ChartTitle
        title="Natijasiz qidiruvlar"
        icon={<Search size={15} />}
        sub="Top-10 so'rov — kutubxonani boyitish uchun signal"
      />
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Hozircha natijasiz qidiruvlar yo'q
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left py-2 font-medium">#</th>
                <th className="text-left py-2 font-medium">So'rov</th>
                <th className="text-right py-2 font-medium">Takrorlar</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s, i) => (
                <tr key={s.query} className="border-b border-border/50 last:border-0">
                  <td className="py-2 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 font-medium max-w-[280px] truncate">{s.query}</td>
                  <td className="py-2 text-right">
                    <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 font-semibold text-red-600">
                      {s.count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main dashboard ──────────────────────────────────────────
export function DiagnosticsDashboard({ data }: { data: DiagnosticsData }) {
  return (
    <div className="space-y-6">
      {/* A. Reading analytics */}
      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Mutolaa tahlili
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <CompletionDonut data={data.completion} />
          <ReadingFunnel data={data.funnel} />
        </div>
        <SessionScatter data={data.sessionScatter} />
      </section>

      {/* B. Category insights */}
      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Kategoriya tahlili
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <CategoryRadar data={data.categoryBalance} />
          <CategoryTrends data={data.categoryTrends} />
        </div>
      </section>

      {/* C. User engagement */}
      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Foydalanuvchi faolligi
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <CohortRetention data={data.cohortRetention} />
          <UserSegments data={data.userSegments} />
        </div>
        <ActivityHeatmap data={data.heatmap} />
      </section>

      {/* D. System health */}
      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tizim diagnostikasi
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <UploadHealth data={data.uploadHealth} />
          <ZeroResultSearches data={data.zeroResultSearches} />
        </div>
      </section>
    </div>
  );
}
