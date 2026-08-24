import Link from "next/link";
import { getSessionUser } from "@/lib/server/auth";
import { listFavorites } from "@/lib/server/reading";
import { BookCardView } from "@/components/book-card-view";
import { EmptyState } from "@/components/ui/empty-state";
import { Heart } from "lucide-react";

export default async function FavoritesPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const items = await listFavorites(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sevimli kitoblar</h1>
        <p className="text-sm text-muted-foreground">Siz qo'shgan kitoblar</p>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-8" />}
          title="Sevimli kitoblar bo'sh"
          description="Sevimli kitoblaringiz shu yerda chiqadi."
          action={<Link href="/books" className="text-primary hover:underline">Kitoblarga o'tish</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((f) => (
            <BookCardView key={f.id} book={f.book!} initialFavorite />
          ))}
        </div>
      )}
    </div>
  );
}
