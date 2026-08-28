"use client";

import { useState } from "react";
import { Search, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

type Book = { id: string; title: string; slug: string; author?: string; category?: string; coverUrl?: string | null; totalPages?: number };

export function TeacherSuggestClient() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ books: Book[]; reason: string } | null>(null);

  const search = async () => {
    if (!prompt.trim() || prompt.trim().length < 3) {
      toast.error("Kamida 3 ta belgi kiriting");
      return;
    }
    setLoading(true);
    try {
      const res: any = await api.post("/api/ai/suggest", { prompt: prompt.trim() });
      setResult(res.data ?? res);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      <h2 className="text-sm font-semibold flex items-center gap-2">
        <Sparkles size={16} className="text-violet-600" /> ✨ AI Book Suggestions
      </h2>
      <p className="text-xs text-muted-foreground">Mavzu yoki kategoriya yozing: masalan &quot;9-sinf o&apos;quvchilariga mos science kitoblar&quot;</p>

      <div className="flex gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='Masalan: 9-sinf uchun science...'
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <Button onClick={search} disabled={loading} className="gap-2 shrink-0">
          <Search size={14} /> {loading ? "..." : "Qidirish"}
        </Button>
      </div>

      {result && (
        <div className="space-y-3">
          <p className="text-xs text-violet-600 bg-violet-50 dark:bg-violet-950/30 p-2 rounded-lg">{result.reason}</p>
          <div className="grid gap-2">
            {result.books.map((b) => (
              <Link key={b.id} href={`/books/${b.slug}`} className="flex gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors">
                <div className="h-14 w-10 rounded bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                  {b.coverUrl ? <img src={b.coverUrl} alt={b.title} className="h-full w-full object-cover" /> : <BookOpen size={16} className="text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.author} · {b.category}</p>
                  <p className="text-xs text-muted-foreground">{b.totalPages} bet</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
