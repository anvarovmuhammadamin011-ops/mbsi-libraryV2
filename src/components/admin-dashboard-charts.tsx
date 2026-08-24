"use client";

interface ChartData {
  day: string;
  pages: number;
  readers: number;
}

export function AdminDashboardCharts({ data }: { data: ChartData[] }) {
  const maxPages = Math.max(...data.map((d) => d.pages), 1);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">Reading Activity</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Pages read per day (last 7 days)</p>
      </div>

      {/* Simple bar chart */}
      <div className="flex items-end gap-2 h-40">
        {data.map((d, i) => {
          const height = maxPages > 0 ? (d.pages / maxPages) * 100 : 0;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground">
                {d.pages > 0 ? d.pages.toLocaleString() : ""}
              </span>
              <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                <div
                  className="w-full rounded-t-md bg-primary/80 transition-all duration-300 hover:bg-primary"
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">{d.day}</span>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-primary/80" />
          <span className="text-xs text-muted-foreground">
            Total: {data.reduce((sum, d) => sum + d.pages, 0).toLocaleString()} pages
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-primary/40" />
          <span className="text-xs text-muted-foreground">
            Avg: {Math.round(data.reduce((sum, d) => sum + d.pages, 0) / 7).toLocaleString()} pages/day
          </span>
        </div>
      </div>
    </div>
  );
}
