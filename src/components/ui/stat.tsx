import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface StatProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
}

export function Stat({ label, value, icon }: StatProps) {
  return (
    <Card className="flex items-center gap-3 p-4">
      {icon && (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-semibold">{value}</p>
      </div>
    </Card>
  );
}
