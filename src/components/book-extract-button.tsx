"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, FileText, Languages, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface BookContent {
  status: string;
  hasText: boolean;
  hasTranslation: boolean;
  hasAnalysis: boolean;
  summary?: string;
  keyPoints?: string[];
  highlights?: any[];
  tableOfContents?: { title: string; page: number }[];
  keyTerms?: string[];
}

interface Props {
  bookId: string;
  bookTitle: string;
}

export function BookExtractButton({ bookId, bookTitle }: Props) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<BookContent | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function fetchContent() {
    try {
      const res = await fetch(`/api/books/${bookId}/extract`);
      const data = await res.json();
      if (data.success) {
        setContent(data.data);
      }
    } catch (e) {
      console.error("Content fetch error:", e);
    }
  }

  async function runExtraction(action: "extract" | "translate" | "analyze" | "all") {
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${bookId}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Operatsiya muvaffaqiyatli bajarildi!");
        await fetchContent();
      } else {
        throw new Error(data.error?.message || "Xatolik yuz berdi");
      }
    } catch (e: any) {
      toast.error(e.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    fetchContent();
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600",
    processing: "bg-blue-500/10 text-blue-600",
    completed: "bg-green-500/10 text-green-600",
    error: "bg-red-500/10 text-red-600",
  };

  const statusLabels: Record<string, string> = {
    pending: "Kutilmoqda",
    processing: "Qayta ishlanmoqda",
    completed: "Tayyor",
    error: "Xatolik",
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={handleOpen}
      >
        <Sparkles size={14} />
        AI
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={18} />
              Kitob matnini qayta ishlash
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{bookTitle}</p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status */}
            {content && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Holat:</span>
                <Badge className={statusColors[content.status] || ""}>
                  {statusLabels[content.status] || content.status}
                </Badge>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => runExtraction("extract")}
                disabled={loading}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText size={16} />}
                Matnni ajratish
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => runExtraction("translate")}
                disabled={loading || !content?.hasText}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Languages size={16} />}
                Tarjima qilish
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => runExtraction("analyze")}
                disabled={loading || !content?.hasText}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles size={16} />}
                Tahlil qilish
              </Button>
            </div>

            <Button
              className="w-full gap-2"
              onClick={() => runExtraction("all")}
              disabled={loading}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles size={16} />}
              Hammasini birga qilish
            </Button>

            {/* Results */}
            {content && content.status === "completed" && (
              <div className="space-y-3 border-t pt-4">
                {/* Summary */}
                {content.summary && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <h4 className="text-sm font-medium mb-2">Xulosa</h4>
                    <p className="text-sm text-muted-foreground">{content.summary}</p>
                  </div>
                )}

                {/* Key Points */}
                {content.keyPoints && content.keyPoints.length > 0 && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <button
                      className="flex items-center justify-between w-full text-sm font-medium mb-2"
                      onClick={() => setExpanded(expanded === "points" ? null : "points")}
                    >
                      Asosiy fikrlar ({content.keyPoints.length})
                      {expanded === "points" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expanded === "points" && (
                      <ul className="space-y-1">
                        {content.keyPoints.map((point, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Key Terms */}
                {content.keyTerms && content.keyTerms.length > 0 && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <button
                      className="flex items-center justify-between w-full text-sm font-medium mb-2"
                      onClick={() => setExpanded(expanded === "terms" ? null : "terms")}
                    >
                      Asosiy atamalar ({content.keyTerms.length})
                      {expanded === "terms" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expanded === "terms" && (
                      <div className="flex flex-wrap gap-1">
                        {content.keyTerms.map((term, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {term}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Highlights */}
                {content.highlights && content.highlights.length > 0 && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <button
                      className="flex items-center justify-between w-full text-sm font-medium mb-2"
                      onClick={() => setExpanded(expanded === "highlights" ? null : "highlights")}
                    >
                      Muhim joylar ({content.highlights.length})
                      {expanded === "highlights" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expanded === "highlights" && (
                      <div className="space-y-2">
                        {content.highlights.map((h, i) => (
                          <div key={i} className="text-sm border-l-2 border-primary/50 pl-2">
                            <p className="text-muted-foreground">{h.text?.substring(0, 100)}...</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              <Badge variant="outline" className="text-[10px] mr-1">
                                {h.importance}
                              </Badge>
                              {h.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
