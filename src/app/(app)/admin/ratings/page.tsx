"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Star } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { DEMO_USERS, DEMO_BOOKS } from "@/lib/demo-data";
import { useLibraryStore } from "@/lib/library-store";

export default function AdminRatingsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { ratings, getAverageRating } = useLibraryStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== "ADMIN") return null;

  const bookRatings = DEMO_BOOKS.map((book) => ({
    book,
    avgRating: getAverageRating(book.id),
    totalRatings: ratings.filter((r) => r.bookId === book.id).length,
  })).filter((b) => b.totalRatings > 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold tracking-tight">⭐ Reytinglar</h1>
          <p className="mt-1 text-muted-foreground">Kitoblar reytinglari</p>
        </div>

        <div className="space-y-3 animate-slide-up">
          {bookRatings.map((item) => (
            <Card key={item.book.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-12 w-9 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <img src={item.book.coverUrl} alt={item.book.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{item.book.title}</p>
                  <p className="text-xs text-muted-foreground">{item.totalRatings} ta reyting</p>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(item.avgRating)} size={16} />
                  <span className="text-sm font-medium">{item.avgRating}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
