"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Users,
  BookMarked,
  BookOpen,
  Clock,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Flame,
  CalendarClock,
  Library,
  FileText,
} from "lucide-react";

const ACCENTS: Record<string, { icon: React.ReactNode; grad: string; glow: string }> = {
  blue: {
    icon: <Flame size={18} />,
    grad: "from-blue-500 to-indigo-500",
    glow: "shadow-blue-500/20",
  },
  emerald: {
    icon: <Users size={18} />,
    grad: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/20",
  },
  violet: {
    icon: <Clock size={18} />,
    grad: "from-violet-500 to-purple-500",
    glow: "shadow-violet-500/20",
  },
  amber: {
    icon: <CheckCircle size={18} />,
    grad: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/20",
  },
  rose: {
    icon: <Sparkles size={18} />,
    grad: "from-rose-500 to-pink-500",
    glow: "shadow-rose-500/20",
  },
  slate: {
    icon: <BookMarked size={18} />,
    grad: "from-slate-600 to-slate-800",
    glow: "shadow-slate-500/20",
  },
};

const CHART_COLORS = {
  primary: "#2563EB",
  primaryLight: "#60A5FA",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  violet: "#8B5CF6",
  muted: "#94A3B8",
  pieColors: ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"],
};

// ─── Types ────────────────────────────────────────────────────
export interface SummaryCard {
  label: string;
  value: string | number;
  sub?: string;
  accent: keyof typeof ACCENTS | string;
}
export interface DailyData {
  date: string;
  label: string;
  sessions: number;
  pages: number;
  users: number;
}
export interface PeakHour { hour: string; sessions: number }
export interface MonthlyGrowth { key: string; label: string; sessions: number }
export interface CategoryDonut { name: string; books: number; reads: number }
export interface UserStatusData { name: string; value: number; color: string }
export interface TopReaderData { name: string; pages: number; sessions: number }
export interface RankedItem { rank: number; title: string; count: number }
export interface PopularCat { rank: number; icon: string; name: string; books: number }
export interface RecentActivityItem {
  id: string;
  userName: string;
  bookTitle: string;
  count: number;
  pages: number;
  minutes: number;
  startedAt: Date;
}

export interface Props {
  summaryCards: SummaryCard[];
  dailyData: DailyData[];
  peakHoursData: PeakHour[];
  monthlyGrowthData: MonthlyGrowth[];
  categoryDonut: CategoryDonut[];
  formatData: { name: string; value: number }[];
  topGenres: { name: string; sessions: number }[];
  userStatusData: UserStatusData[];
  topReadersData: TopReaderData[];
  topStudents: { name: string; sessions: number; pages: number }[];
  topTeachers: { name: string; sessions: number; pages: number; minutes: number }[];
  mostRead: RankedItem[];
  mostSaved: RankedItem[];
  popularCats: PopularCat[];
  recentActivity: RecentActivityItem[];
  totalBooks: number;
  publishedBooks: number;
  totalPages: number;
  totalMinutes: number;
}

export function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5" role="figure">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span
            className="inline-block h-2 w-2 rounded-full mr-1.5"
            style={{ backgroundColor: entry.color || entry.payload?.fill }}
          />
          {entry.name}:{" "}
          <span className="font-medium text-foreground">
            {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── KPI Cards (glassmorphism) ───────────────────────────────
export function KpiCards({ cards }: { cards: SummaryCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, i) => {
        const a = ACCENTS[card.accent] ?? ACCENTS.slate;
        return (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            role="figure"
            aria-label={`${card.label}: ${card.value}`}
          >
            {/* Glass shine */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-2xl dark:from-white/10" />
            <div className="flex items-start justify-between mb-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${a.grad} ${a.glow}`}
              >
                {a.icon}
              </div>
              <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {card.sub?.split(" ")[0] ?? ""}
              </span>
            </div>
            <p className="text-xl font-bold text-foreground tracking-tight">{card.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Peak Reading Hours (Bar) ────────────────────────────────
export function PeakHours({ data }: { data: PeakHour[] }) {
  return (
    <ChartCard title="⏰ Peak reading hours" sub="Foydalanuvchilar eng faol o'qigan vaqtlar · 30 kun">
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval={2} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="sessions" name="Sessiyalar" fill={CHART_COLORS.violet} radius={[4, 4, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// ─── Monthly growth (Area) ───────────────────────────────────
export function MonthlyGrowth({ data }: { data: MonthlyGrowth[] }) {
  return (
    <ChartCard title="📈 Oylik mutolaa o'sishi" sub="Oxirgi 6 oy · sessiyalar soni">
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.35} />
                <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="sessions" name="Sessiyalar" stroke={CHART_COLORS.success} strokeWidth={2.5} fill="url(#monthlyGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// ─── Category donut ──────────────────────────────────────────
export function CategoryDonut({ data }: { data: CategoryDonut[] }) {
  const totalReads = data.reduce((s, d) => s + d.reads, 0);
  const pie = data.filter((d) => d.reads > 0).map((d) => ({ name: d.name, value: d.reads }));
  return (
    <ChartCard title="🗂️ Kategoriyalar bo'yicha o'qilish" sub={`Jami ${totalReads} ta o'qish`}>
      <div className="h-[240px] flex items-center justify-center">
        {pie.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="transparent">
                {pie.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS.pieColors[i % CHART_COLORS.pieColors.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
                      <p className="text-xs font-semibold text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.value} ta o'qish</p>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">O'qish ma'lumotlari hali yo'q</p>
        )}
      </div>
    </ChartCard>
  );
}

// ─── Formats + top genres mini-cards ─────────────────────────
export function FormatsGenres({
  formatData,
  topGenres,
}: {
  formatData: { name: string; value: number }[];
  topGenres: { name: string; sessions: number }[];
}) {
  const total = formatData.reduce((s, d) => s + d.value, 0);
  return (
    <ChartCard title="📦 Formatlar va eng ko'p o'qilgan janrlar" sub="PDF vs Audio · oylik janr trendlari">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {formatData.map((f) => {
            const pct = total > 0 ? Math.round((f.value / total) * 100) : 0;
            return (
              <div key={f.name} className="rounded-xl border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <FileText size={13} className="text-muted-foreground" /> {f.name}
                  </span>
                  <span className="text-xs font-bold text-foreground">{pct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Top janrlar (6 oy)</p>
          {topGenres.length === 0 ? (
            <p className="text-xs text-muted-foreground">Hali ma'lumot yo'q</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {topGenres.map((g) => (
                <span
                  key={g.name}
                  className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                >
                  {g.name} · {g.sessions}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </ChartCard>
  );
}

// ─── Top Students / Teachers tabs ────────────────────────────
export function TopUsersTabs({
  students,
  teachers,
}: {
  students: { name: string; sessions: number; pages: number }[];
  teachers: { name: string; sessions: number; pages: number; minutes: number }[];
}) {
  const [tab, setTab] = useState<"students" | "teachers">("students");
  const rows = tab === "students" ? students : teachers;

  return (
    <ChartCard title="🏆 Top faollar" sub="Eng faol o'quvchilar va o'qituvchilar">
      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-muted/60 p-1">
        <button
          onClick={() => setTab("students")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            tab === "students" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🎓 O'quvchilar
        </button>
        <button
          onClick={() => setTab("teachers")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            tab === "teachers" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          👨‍🏫 O'qituvchilar
        </button>
      </div>

      <div className="space-y-1.5">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Hali ma'lumot yo'q</p>
        ) : (
          rows.map((u, i) => (
            <div key={u.name} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/40 transition-colors">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  i === 0
                    ? "bg-gradient-to-br from-yellow-400 to-amber-500"
                    : i === 1
                      ? "bg-gradient-to-br from-gray-300 to-gray-500"
                      : i === 2
                        ? "bg-gradient-to-br from-orange-300 to-orange-500"
                        : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {u.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {u.sessions} sessiya
                  {tab === "teachers" ? ` · ${(u as any).minutes} daq` : ""}
                </p>
              </div>
              <p className="text-sm font-semibold text-foreground">{u.pages.toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </ChartCard>
  );
}

// ─── Ranked lists ────────────────────────────────────────────
export function RankedList({
  title,
  items,
  color,
}: {
  title: string;
  items: RankedItem[];
  color: "blue" | "amber";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground mb-3">{title}</h2>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hali ma'lumot yo'q</p>
        ) : (
          items.map((r) => (
            <div key={r.title} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 truncate">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    color === "amber" ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
                  }`}
                >
                  {r.rank}
                </span>
                <span className="truncate max-w-[170px]">{r.title}</span>
              </span>
              <span className="text-xs font-medium text-muted-foreground">{r.count} marta</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Recent activity (grouped) ───────────────────────────────
export function RecentActivity({ items }: { items: RecentActivityItem[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">So'nggi faoliyat</h2>
        <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {items.length} ta guruh
        </span>
      </div>
      <div className="space-y-2.5">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Hali faoliyat yo'q</p>
        ) : (
          items.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/50 transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-emerald-600">
                <BookOpen size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{s.userName}</span>{" "}
                  <span className="text-muted-foreground">·</span>{" "}
                  <span className="font-medium">{s.bookTitle}</span>
                  {s.count > 1 && (
                    <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      ×{s.count}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.pages} sahifa · {s.minutes} daqiqa
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                {new Date(s.startedAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── User growth area ────────────────────────────────────────
export function UserGrowthChart({ data }: { data: DailyData[] }) {
  const userGrowthData = data.map((d) => ({ label: d.label, users: d.users, sessions: d.sessions }));
  return (
    <ChartCard title="📈 Foydalanuvchilar o'sishi" sub="Oxirgi 30 kun · yangi a'zolar va sessiyalar">
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={userGrowthData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="users" name="Yangi a'zolar" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#colorUsers)" />
            <Area type="monotone" dataKey="sessions" name="Sessiyalar" stroke={CHART_COLORS.success} strokeWidth={2} fill="url(#colorSessions)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// ─── Popular categories card ─────────────────────────────────
export function PopularCatsCard({
  cats,
  publishedBooks,
  totalBooks,
}: {
  cats: PopularCat[];
  publishedBooks: number;
  totalBooks: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground mb-3">🗂️ Mashhur kategoriyalar</h2>
      <div className="space-y-2">
        {cats.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hali kategoriya yo'q</p>
        ) : (
          cats.map((c) => (
            <div key={c.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 truncate">
                <span className="text-base">{c.icon}</span>
                <span className="truncate">{c.name}</span>
              </span>
              <span className="text-xs font-medium text-muted-foreground">{c.books} kitob</span>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/40 p-3 text-xs">
        <span className="text-muted-foreground">Nashr etilgan</span>
        <span className="font-semibold text-foreground">
          {publishedBooks} / {totalBooks}
        </span>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────
export function AdminDashboardCharts({
  summaryCards,
  dailyData,
  peakHoursData,
  monthlyGrowthData,
  categoryDonut,
  formatData,
  topGenres,
  userStatusData,
  topReadersData,
  topStudents,
  topTeachers,
  mostRead,
  mostSaved,
  popularCats,
  recentActivity,
  totalBooks,
  publishedBooks,
  totalPages,
  totalMinutes,
}: Props) {
  return (
    <div className="space-y-8">
      {/* ═══ KPI CARDS ═══ */}
      <KpiCards cards={summaryCards} />

      {/* ═══ CHARTS ROW 1 ═══ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PeakHours data={peakHoursData} />
        <MonthlyGrowth data={monthlyGrowthData} />
      </div>

      {/* ═══ CHARTS ROW 2 ═══ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryDonut data={categoryDonut} />
        <FormatsGenres formatData={formatData} topGenres={topGenres} />
      </div>

      {/* ═══ USER GROWTH AREA ═══ */}
      <UserGrowthChart data={dailyData} />

      {/* ═══ TOP USERS TAB + RANKED LISTS ═══ */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TopUsersTabs students={topStudents} teachers={topTeachers} />
        </div>
        <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
          <RankedList title="📚 Eng ko'p o'qilgan kitoblar" items={mostRead} color="blue" />
          <RankedList title="🔖 Eng ko'p saqlangan kitoblar" items={mostSaved} color="amber" />
        </div>
      </div>

      {/* ═══ POPULAR CATS + RECENT ═══ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PopularCatsCard cats={popularCats} publishedBooks={publishedBooks} totalBooks={totalBooks} />
        <RecentActivity items={recentActivity} />
      </div>
    </div>
  );
}