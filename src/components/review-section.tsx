"use client";

import { useState, useEffect } from "react";
import { Star, Edit3, Trash2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

type Review = {
  id: string;
  userId: string;
  bookId: string;
  rating: number;
  text: string;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; avatar: string | null };
};

export function ReviewSection({
  bookId,
  currentUserId,
  hasStarted,
  initialReviews,
  initialUserReview,
  initialUserRating,
}: {
  bookId: string;
  currentUserId: string;
  hasStarted: boolean;
  initialReviews: Review[];
  initialUserReview: Review | null;
  initialUserRating: number | null;
}) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState(initialUserRating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState(initialUserReview?.text ?? "");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRating = async (value: number) => {
    if (!hasStarted) {
      toast.error("Avval kitobni o'qishni boshlang");
      return;
    }
    setRating(value);
    try {
      await api.post("/api/ratings", { bookId, rating: value });
      toast.success("Reyting saqlandi ⭐");
    } catch (e: any) {
      toast.error(e.message || "Xatolik");
    }
  };

  const handleSubmitReview = async () => {
    if (!hasStarted) {
      toast.error("Avval kitobni o'qishni boshlang");
      return;
    }
    if (!text.trim() || text.trim().length < 3) {
      toast.error("Sharh juda qisqa");
      return;
    }
    if (rating === 0) {
      toast.error("Avval yulduz tanlang");
      return;
    }
    setSubmitting(true);
    try {
      const res: any = await api.post("/api/reviews", { bookId, rating, text: text.trim() });
      const saved = res.data ?? res;
      const review: Review = saved.id ? saved : { id: Date.now().toString(), userId: currentUserId, bookId, rating, text: text.trim(), isHidden: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), user: { id: currentUserId, name: "Siz", avatar: null } };
      setReviews((prev) => {
        const exists = prev.find((r) => r.userId === currentUserId);
        if (exists) return prev.map((r) => (r.userId === currentUserId ? { ...r, rating, text: text.trim() } : r));
        return [review, ...prev];
      });
      toast.success("Sharh saqlandi");
    } catch (e: any) {
      toast.error(e.message || "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sharhni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/api/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      if (initialUserReview?.id === id) {
        setText("");
        setRating(0);
      }
      toast.success("O'chirildi");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const startEdit = (r: Review) => {
    setEditingId(r.id);
    setEditRating(r.rating);
    setEditText(r.text);
  };

  const handleUpdate = async (id: string) => {
    if (!editText.trim() || editText.trim().length < 3) {
      toast.error("Sharh juda qisqa");
      return;
    }
    try {
      const res: any = await api.patch(`/api/reviews/${id}`, { rating: editRating, text: editText.trim() });
      const updated = res.data ?? res;
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, rating: editRating, text: editText.trim() } : r)));
      setEditingId(null);
      toast.success("Yangilandi");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6 mt-8">
      {/* Rating */}
      <div>
        <h3 className="text-base font-semibold text-foreground">⭐ Baho bering</h3>
        {!hasStarted ? (
          <p className="mt-2 text-sm text-muted-foreground">Avval kitobni o'qishni boshlang, keyin baho bera olasiz.</p>
        ) : (
          <div className="mt-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRating(n)}
                className="p-1"
                aria-label={`${n} yulduz`}
              >
                <Star
                  size={28}
                  className={
                    n <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  }
                />
              </button>
            ))}
            <span className="ml-2 text-sm font-medium text-foreground">{rating ? `${rating} / 5` : "Tanlang"}</span>
          </div>
        )}
      </div>

      {/* Write Review */}
      <div>
        <h3 className="text-base font-semibold text-foreground">✍️ Sharh yozish</h3>
        {!hasStarted ? (
          <p className="mt-2 text-sm text-muted-foreground">Sharh yozish uchun avval kitobni o'qishni boshlang.</p>
        ) : (
          <div className="mt-3 space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a review..."
              rows={3}
              maxLength={2000}
            />
            <Button onClick={handleSubmitReview} disabled={submitting} className="gap-2">
              <Send size={14} />
              {submitting ? "Yuborilmoqda..." : initialUserReview ? "Yangilash" : "Yuborish"}
            </Button>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div>
        <h3 className="text-base font-semibold text-foreground">💬 Sharhlar ({reviews.length})</h3>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Hali sharhlar yo&apos;q. Birinchi bo'lib yozing!</p>
        ) : (
          <div className="mt-3 space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-3">
                {editingId === r.id ? (
                  <div className="space-y-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => setEditRating(n)} className="p-1">
                          <Star size={20} className={n <= editRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"} />
                        </button>
                      ))}
                    </div>
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdate(r.id)}>Saqlash</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X size={14} /> Bekor
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {r.user.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{r.user.name}</p>
                        <div className="flex shrink-0 items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} className={i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"} />
                          ))}
                        </div>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-foreground whitespace-pre-wrap">{r.text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("uz-UZ")}</p>
                      {r.userId === currentUserId && (
                        <div className="mt-2 flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => startEdit(r)}>
                            <Edit3 size={12} /> Tahrirlash
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)}>
                            <Trash2 size={12} /> O'chirish
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
