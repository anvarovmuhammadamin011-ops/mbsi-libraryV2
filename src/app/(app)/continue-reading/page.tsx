import Link from "next/link";
import { getSessionUser } from "@/lib/server/auth";
import { listContinueReading } from "@/lib/server/reading";
import { BookCardView } from "@/components/book-card-view";
import { EmptyState } from "@/components/ui/empty-state";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContinueReadingPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const items = await listContinueReading(user.id, 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">O'qishni davom ettirish</h1>
        <p className="text-sm text-muted-foreground">Boshlagan kitoblaringiz</p>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-8" />}
          title="Hali boshlangan kitob yo'q"
          description="Kitoblar sahifasidan o'qishni boshlang."
          action={<Link href="/books" className="text-primary hover:underline">Kitoblarga o'tish</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((p) => (
            <BookCardView key={p.bookId} book={p.book!} progress={p} />
          ))}
        </div>
      )}
    </div>
  );
}
