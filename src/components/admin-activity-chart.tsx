"use client";

interface DayData {
  date: string;
  label: string;
  sessions: number;
}

export function AdminActivityChart({ data }: { data: DayData[] }) {
  const max = Math.max(1, ...data.map((d) => d.sessions));
  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((d, i) => {
        const pct = d.sessions > 0 ? Math.max((d.sessions / max) * 100, 6) : 3;
        return (
          <div
            key={d.date}
            className="group relative flex-1 flex flex-col items-center justify-end h-full min-w-0"
            title={`${d.label}: ${d.sessions} sessiya`}
          >
            <span className="text-[9px] text-muted-foreground mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {d.sessions || ""}
            </span>
            <div
              className={`w-full max-w-[14px] rounded-t-md transition-all duration-500 ${
                i === data.length - 1 ? "bg-primary" : "bg-primary/55 group-hover:bg-primary/80"
              }`}
              style={{ height: `${pct}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
