import Link from "next/link";
import { getSessionUser } from "@/lib/server/auth";
import { listFavorites } from "@/lib/server/reading";
import { BookCardView } from "@/components/book-card-view";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Heart, Library } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const items = await listFavorites(user.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sevimli kitoblar</h1>
        <p className="text-sm text-muted-foreground mt-1">Siz qo&apos;shgan kitoblar</p>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-8" />}
          title="Hali sevimli kitoblar yo'q"
          description="O'zingizga yoqqan kitoblarni saqlang."
          action={
            <Button render={<Link href="/books" />} variant="outline" className="gap-1.5">
              <Library size={14} /> Kitoblarni ko'rish
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((f) => (
            <BookCardView key={f.id} book={f.book!} initialFavorite />
          ))}
        </div>
      )}
    </div>
  );
}
