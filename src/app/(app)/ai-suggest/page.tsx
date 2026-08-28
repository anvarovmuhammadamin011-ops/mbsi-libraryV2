export const dynamic = "force-dynamic";

import { getSessionUser } from "@/lib/server/auth";
import { TeacherSuggestClient } from "@/components/teacher-suggest-client";
import { getAiRecommendations } from "@/lib/server/ai-recommendations";

export default async function AiSuggestPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const insights = user.role === "TEACHER" || user.role === "ADMIN"
    ? await getAiRecommendations(user.id, 4)
    : [];

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold">🤖 Teacher AI</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {user.role === "TEACHER"
            ? "O'zingiz o'qigan kitoblar asosida tavsiyalar va mavzu bo'yicha qidiruv"
            : "AI Book Suggestions — mavjud kutubxonadan mos kitoblar"}
        </p>
      </div>

      {insights.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-2">📖 Sizning Reading Insights</h2>
          <p className="text-xs text-muted-foreground mb-3">O'qigan kitoblaringiz asosida tavsiyalar:</p>
          <div className="grid gap-2">
            {insights.map(({ book, reason }) => (
              <div key={book.id} className="flex gap-3 rounded-xl border p-3">
                <div className="h-12 w-9 rounded bg-muted shrink-0 overflow-hidden">
                  {book.coverUrl ? <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground">{book.author?.name}</p>
                  <p className="text-xs text-violet-600 mt-1">{reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <TeacherSuggestClient />
    </div>
  );
}
