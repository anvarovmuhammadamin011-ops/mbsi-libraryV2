import Link from "next/link";
import { getSessionUser } from "@/lib/server/auth";
import { listBookmarks } from "@/lib/server/reading";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Bookmark, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const items = await listBookmarks(user.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Xatcho&apos;plar</h1>
        <p className="text-sm text-muted-foreground mt-1">Saqlangan sahifalar</p>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="size-8" />}
          title="Saqlangan sahifalar yo'q"
          description="O'qish jarayonida xatcho'p qo'shishingiz mumkin."
        />
      ) : (
        <div className="space-y-2">
          {items.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bookmark size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/books/${b.book?.slug}`}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {b.book?.title}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sahifa {b.page}
                  {b.note ? ` · ${b.note}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                render={<Link href={`/reader/${b.book?.slug}?page=${b.page}`} />}
                className="gap-1.5 shrink-0"
              >
                <BookOpen size={13} /> O'qish
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
