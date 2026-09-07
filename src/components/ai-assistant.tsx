"use client";

import { useState } from "react";
import { Sparkles, BookOpen, FileText, Search, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/language-provider";

type Action = "explain" | "summarize" | "define" | "ask";

export function AiAssistant({ initialText }: { initialText?: string }) {
  const { t } = useLanguage();
  const [selectedText, setSelectedText] = useState(initialText ?? "");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const call = async (action: Action) => {
    const text = window.getSelection()?.toString().trim() || selectedText;
    if (!text || text.length < 3) {
      toast.error(t.ai.selectTextFirst);
      return;
    }
    if (action === "ask" && !question.trim()) {
      toast.error(t.ai.enterQuestion);
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
      <button
        onClick={() => setOpen(true)}
        aria-label={t.ai.assistant}
        title={t.ai.assistant}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-white/50 bg-white/60 text-violet-600 shadow-lg shadow-black/10 backdrop-blur-xl transition-all hover:scale-105 active:scale-95 dark:border-white/10 dark:bg-slate-800/60 dark:text-violet-300 dark:shadow-black/40"
      >
        <Sparkles size={24} strokeWidth={2.25} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-[380px] z-40 rounded-2xl border border-border bg-card shadow-2xl p-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles size={14} className="text-violet-600" /> {t.ai.assistant}
        </h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)} aria-label={t.ai.close}>
          <X size={14} />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{t.ai.hint}</p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Button variant="outline" size="sm" onClick={() => call("explain")} disabled={loading} className="gap-1">
          <BookOpen size={12} /> {t.ai.explain}
        </Button>
        <Button variant="outline" size="sm" onClick={() => call("summarize")} disabled={loading} className="gap-1">
          <FileText size={12} /> {t.ai.summarize}
        </Button>
        <Button variant="outline" size="sm" onClick={() => call("define")} disabled={loading} className="gap-1">
          <Search size={12} /> {t.ai.define}
        </Button>
        <Button variant="outline" size="sm" onClick={() => call("ask")} disabled={loading} className="gap-1">
          <MessageCircle size={12} /> {t.ai.ask}
        </Button>
      </div>

      <Textarea
        placeholder={t.ai.textPlaceholder}
        value={selectedText}
        onChange={(e) => setSelectedText(e.target.value)}
        rows={3}
        className="text-sm"
      />
      <Input
        placeholder={t.ai.questionPlaceholder}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="mt-2 h-8 text-sm"
      />

      {loading && <p className="mt-3 text-sm text-muted-foreground">{t.ai.thinking}</p>}
      {answer && (
        <div className="mt-3 rounded-xl bg-muted/50 p-3 text-sm leading-relaxed whitespace-pre-wrap">
          {answer}
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">{t.ai.disclaimer}</p>
    </div>
  );
}
