import type { ReactNode } from "react";

interface StatProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
}

export function Stat({ label, value, icon }: StatProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5">
      {icon && (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="truncate text-xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
