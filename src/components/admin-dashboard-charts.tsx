"use client";

import { useMemo } from "react";
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
import { Users, BookMarked, Activity, UserPlus } from "lucide-react";

interface SummaryCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

interface DailyData {
  date: string;
  label: string;
  users: number;
  sessions: number;
  pages: number;
}

interface UserStatusData {
  name: string;
  value: number;
  color: string;
}

interface TopReaderData {
  name: string;
  pages: number;
  sessions: number;
}

interface AdminDashboardChartsProps {
  summaryCards: SummaryCard[];
  dailyData: DailyData[];
  userStatusData: UserStatusData[];
  topReadersData: TopReaderData[];
}

const CHART_COLORS = {
  primary: "#2563EB",
  primaryLight: "#60A5FA",
  primaryDark: "#1D4ED8",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  muted: "#94A3B8",
  pieColors: ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span
            className="inline-block h-2 w-2 rounded-full mr-1.5"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: <span className="font-medium text-foreground">{entry.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

export function AdminDashboardCharts({
  summaryCards,
  dailyData,
  userStatusData,
  topReadersData,
}: AdminDashboardChartsProps) {
  return (
    <div className="space-y-6">
      {/* ═══ SUMMARY CARDS ═══ */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {summaryCards.map((card, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-shadow"
            role="figure"
            aria-label={`${card.label}: ${card.value}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {card.icon}
              </div>
              {card.change && (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    card.changeType === "positive"
                      ? "bg-green-50 text-green-600 dark:bg-green-950/30"
                      : card.changeType === "negative"
                        ? "bg-red-50 text-red-600 dark:bg-red-950/30"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {card.change}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* ═══ CHARTS ROW ═══ */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Area Chart */}
        <div className="rounded-2xl border border-border bg-card p-5" role="figure" aria-label="Foydalanuvchilar o'sishi diagrammasi">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">📈 Foydalanuvchilar o'sishi</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Oxirgi 30 kun</p>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
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
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="Foydalanuvchilar"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  fill="url(#colorUsers)"
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  name="Sessiyalar"
                  stroke={CHART_COLORS.success}
                  strokeWidth={2}
                  fill="url(#colorSessions)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active vs Inactive Pie Chart */}
        <div className="rounded-2xl border border-border bg-card p-5" role="figure" aria-label="Faol va nofaol foydalanuvchilar nisbati">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">👥 Faollik nisbati</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Faol va nofaol foydalanuvchilar</p>
          </div>
          <div className="h-[250px] flex items-center justify-center">
            {userStatusData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    aria-label="Faollik nisbati"
                  >
                    {userStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
                          <p className="text-xs font-semibold text-foreground">{data.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {data.value.toLocaleString()} foydalanuvchi
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs text-muted-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Ma'lumotlar hali mavjud emas</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══ TOP READERS BAR CHART ═══ */}
      <div className="rounded-2xl border border-border bg-card p-5" role="figure" aria-label="Eng ko'p o'qigan foydalanuvchilar">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">🏆 Top o'quvchilar</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Eng ko'p sahifa o'qigan foydalanuvchilar</p>
        </div>
        <div className="h-[250px]">
          {topReadersData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topReadersData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="pages"
                  name="Sahifalar"
                  fill={CHART_COLORS.primary}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="sessions"
                  name="Sessiyalar"
                  fill={CHART_COLORS.primaryLight}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">Ma'lumotlar hali mavjud emas</p>
          )}
        </div>
      </div>
    </div>
  );
}
