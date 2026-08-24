import Link from "next/link";
import { getSessionUser } from "@/lib/server/auth";
import { listContinueReading } from "@/lib/server/reading";
import { BookCardView } from "@/components/book-card-view";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { BookOpen, Library } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContinueReadingPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const items = await listContinueReading(user.id, 50);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">O&apos;qishni davom ettirish</h1>
        <p className="text-sm text-muted-foreground mt-1">Boshlagan kitoblaringiz</p>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-8" />}
          title="Hali boshlangan kitob yo'q"
          description="Kitoblar sahifasidan o'qishni boshlang."
          action={
            <Button render={<Link href="/books" />} variant="outline" className="gap-1.5">
              <Library size={14} /> Kitoblarga o'tish
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((p) => (
            <BookCardView key={p.bookId} book={p.book!} progress={p} />
          ))}
        </div>
      )}
    </div>
  );
}
