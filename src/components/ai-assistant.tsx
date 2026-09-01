"use client";

import { useState } from "react";
import { Sparkles, BookOpen, FileText, Search, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

type Action = "explain" | "summarize" | "define" | "ask";

export function AiAssistant({ initialText }: { initialText?: string }) {
  const [selectedText, setSelectedText] = useState(initialText ?? "");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const call = async (action: Action) => {
    const text = window.getSelection()?.toString().trim() || selectedText;
    if (!text || text.length < 3) {
      toast.error("Avval matnni belgilang");
      return;
    }
    if (action === "ask" && !question.trim()) {
      toast.error("Savol kiriting");
      return;
    }
    setLoading(true);
    setAnswer("");
    try {
      const res: any = await api.post("/api/ai/assist", { action, text, question: question.trim() || undefined });
      setAnswer(res.data?.answer ?? res.answer ?? "");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 rounded-full shadow-lg gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700"
        size="sm"
      >
        <Sparkles size={14} /> ✨ AI Assistant
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-[380px] z-40 rounded-2xl border border-border bg-card shadow-2xl p-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles size={14} className="text-violet-600" /> ✨ AI Assistant
        </h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)} aria-label="Yopish">
          <X size={14} />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Matnni belgilang va amalni tanlang. AI faqat tanlangan matn asosida javob beradi.</p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Button variant="outline" size="sm" onClick={() => call("explain")} disabled={loading} className="gap-1">
          <BookOpen size={12} /> Explain
        </Button>
        <Button variant="outline" size="sm" onClick={() => call("summarize")} disabled={loading} className="gap-1">
          <FileText size={12} /> Summarize
        </Button>
        <Button variant="outline" size="sm" onClick={() => call("define")} disabled={loading} className="gap-1">
          <Search size={12} /> Define word
        </Button>
        <Button variant="outline" size="sm" onClick={() => call("ask")} disabled={loading} className="gap-1">
          <MessageCircle size={12} /> Ask question
        </Button>
      </div>

      <Textarea
        placeholder="Tanlangan matn bu yerda ko'rinadi..."
        value={selectedText}
        onChange={(e) => setSelectedText(e.target.value)}
        rows={3}
        className="text-sm"
      />
      <Input
        placeholder="Savol (Ask uchun)..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="mt-2 h-8 text-sm"
      />

      {loading && <p className="mt-3 text-sm text-muted-foreground">AI o'ylamoqda...</p>}
      {answer && (
        <div className="mt-3 rounded-xl bg-muted/50 p-3 text-sm leading-relaxed whitespace-pre-wrap">
          {answer}
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">AI faqat tanlangan matn kontekstida javob beradi, uydirma qilmaydi.</p>
    </div>
  );
}
