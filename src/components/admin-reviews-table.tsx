"use client";

import { useState } from "react";
import { Star, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

type Review = {
  id: string;
  rating: number;
  text: string;
  isHidden: boolean;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
  book: { id: string; title: string; slug: string };
};

export function AdminReviewsTable({ reviews: initial }: { reviews: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(initial);

  const toggleHide = async (r: Review) => {
    try {
      const res: any = await api.patch(`/api/admin/reviews/${r.id}`, { isHidden: !r.isHidden });
      const updated = res.data ?? res;
      setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, isHidden: !x.isHidden } : x)));
      toast.success(r.isHidden ? "Ko'rsatildi" : "Yashirildi");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sharhni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/api/admin/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success("O'chirildi");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">Hali sharhlar yo&apos;q</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {reviews.map((r) => (
        <div key={r.id} className={`rounded-xl border p-4 ${r.isHidden ? "opacity-60 bg-muted/30" : "bg-card"}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {r.user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{r.user.name}</p>
                <p className="text-xs text-muted-foreground">{r.book.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12} className={i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"} />
              ))}
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap">{r.text}</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("uz-UZ")}</p>
            {r.isHidden && <Badge variant="secondary" className="text-[11px]">Yashirilgan</Badge>}
          </div>
          <div className="mt-3 flex gap-1">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => toggleHide(r)}>
              {r.isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
              {r.isHidden ? "Ko'rsatish" : "Yashirish"}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)}>
              <Trash2 size={12} /> O'chirish
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
