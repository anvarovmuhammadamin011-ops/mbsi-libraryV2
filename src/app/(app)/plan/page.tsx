import { ReadingGoalCard } from "@/components/reading-goal-card";
import { Target } from "lucide-react";

export const dynamic = "force-dynamic";

export default function PlanPage() {
  return (
    <div className="max-w-md md:max-w-lg lg:max-w-xl mx-auto animate-fade-in space-y-4 pb-20 md:pb-0">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Target size={20} className="text-primary" /> Shaxsiy reja
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          O'qish maqsadlaringizni belgilang va kuzatib boring
        </p>
      </div>

      <ReadingGoalCard />
    </div>
  );
}
