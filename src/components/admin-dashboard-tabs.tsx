"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  GraduationCap,
  BookMarked,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  KpiCards,
  PeakHours,
  MonthlyGrowth,
  CategoryDonut,
  FormatsGenres,
  TopUsersTabs,
  RankedList,
  RecentActivity,
  UserGrowthChart,
  PopularCatsCard,
  type Props as DashboardProps,
} from "./admin-dashboard-charts";
import {
  CompletionDonut,
  ReadingFunnel,
  SessionScatter,
  CategoryRadar,
  CategoryTrends,
  CohortRetention,
  ActivityHeatmap,
  UserSegments,
  UploadHealth,
  ZeroResultSearches,
} from "./diagnostics-dashboard";
import type { DiagnosticsData } from "@/lib/server/diagnostics";

type TabId = "all" | "students" | "books" | "system";

const TABS: {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: "all", label: "Barchasi", icon: LayoutDashboard },
  { id: "students", label: "O'quvchilar", icon: GraduationCap },
  { id: "books", label: "Kitoblar", icon: BookMarked },
  { id: "system", label: "Tizim", icon: Activity },
];

export function AdminDashboardTabs(
  props: DashboardProps & { diagnostics: DiagnosticsData }
) {
  const [tab, setTab] = useState<TabId>("all");
  const dg = props.diagnostics;

  return (
    <div className="space-y-6">
      {/* ─── Tab switcher ─── */}
      <div
        role="tablist"
        aria-label="Boshqaruv paneli bo'limlari"
        className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── Barchasi: umumiy ko'rinish ─── */}
      {tab === "all" && (
        <div className="space-y-8 animate-fade-in">
          <KpiCards cards={props.summaryCards} />
          <UserGrowthChart data={props.dailyData} />
          <div className="grid gap-6 lg:grid-cols-2">
            <PeakHours data={props.peakHoursData} />
            <MonthlyGrowth data={props.monthlyGrowthData} />
          </div>
          <RecentActivity items={props.recentActivity} />
        </div>
      )}

      {/* ─── O'quvchilar ─── */}
      {tab === "students" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid gap-6 lg:grid-cols-2">
            <TopUsersTabs
              students={props.topStudents}
              teachers={props.topTeachers}
            />
            <UserSegments data={dg.userSegments} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <CompletionDonut data={dg.completion} />
            <ReadingFunnel data={dg.funnel} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <SessionScatter data={dg.sessionScatter} />
            <CohortRetention data={dg.cohortRetention} />
          </div>
          <ActivityHeatmap data={dg.heatmap} />
        </div>
      )}

      {/* ─── Kitoblar ─── */}
      {tab === "books" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid gap-6 lg:grid-cols-3">
            <RankedList
              title="Eng ko'p o'qilgan kitoblar"
              items={props.mostRead}
              color="blue"
            />
            <RankedList
              title="Eng ko'p saqlangan kitoblar"
              items={props.mostSaved}
              color="amber"
            />
            <PopularCatsCard
              cats={props.popularCats}
              publishedBooks={props.publishedBooks}
              totalBooks={props.totalBooks}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <CategoryDonut data={props.categoryDonut} />
            <FormatsGenres
              formatData={props.formatData}
              topGenres={props.topGenres}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <CategoryRadar data={dg.categoryBalance} />
            <CategoryTrends data={dg.categoryTrends} />
          </div>
        </div>
      )}

      {/* ─── Tizim ─── */}
      {tab === "system" && (
        <div className="grid gap-6 lg:grid-cols-2 animate-fade-in">
          <UploadHealth data={dg.uploadHealth} />
          <ZeroResultSearches data={dg.zeroResultSearches} />
        </div>
      )}
    </div>
  );
}
