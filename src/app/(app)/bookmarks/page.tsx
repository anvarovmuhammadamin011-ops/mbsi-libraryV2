import Link from "next/link";
import { getSessionUser } from "@/lib/server/auth";
import { listBookmarks } from "@/lib/server/reading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Bookmark, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const items = await listBookmarks(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Xatcho'plar</h1>
        <p className="text-sm text-muted-foreground">Saqlangan sahifalar</p>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="size-8" />}
          title="Saqlangan sahifalar yo'q"
          description="O'qish jarayonida xatcho'p qo'shishingiz mumkin."
        />
      ) : (
        <div className="grid gap-3">
          {items.map((b) => (
            <Card key={b.id} className="flex items-center gap-4 p-4">
              <Bookmark className="size-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <Link href={`/books/${b.book?.slug}`} className="font-medium hover:text-primary">
                  {b.book?.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  Sahifa {b.page}
                  {b.note ? ` · ${b.note}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                render={<Link href={`/reader/${b.book?.slug}?page=${b.page}`} />}
                className="gap-2"
              >
                <BookOpen size={14} /> O'qish
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
