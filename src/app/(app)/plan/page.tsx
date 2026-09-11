import { ReadingGoalCard } from "@/components/reading-goal-card";
import { Target } from "lucide-react";
import { getLang } from "@/lib/i18n/get-lang";
import { getDict } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const lang = await getLang();
  const t = getDict(lang);
  return (
    <div className="max-w-md md:max-w-lg lg:max-w-xl mx-auto animate-fade-in space-y-4 pb-28 md:pb-0">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Target size={20} className="text-primary" /> {t.plan.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t.plan.subtitle}
        </p>
      </div>

      <ReadingGoalCard />
    </div>
  );
}
