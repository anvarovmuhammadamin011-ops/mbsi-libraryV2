"use client";

import { useState } from "react";
import { Send, Sparkles, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

type Msg = { role: "user" | "assistant"; text: string };

export function AdminAiChat() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    const q = question.trim();
    if (!q || q.length < 3) {
      toast.error("Savol kiriting");
      return;
    }
    setHistory((h) => [...h, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const res: any = await api.post("/api/ai/admin-chat", { question: q });
      const answer = res.data?.answer ?? res.answer ?? "Javob topilmadi";
      setHistory((h) => [...h, { role: "assistant", text: answer }]);
    } catch (e: any) {
      toast.error(e.message);
      setHistory((h) => [...h, { role: "assistant", text: "Xatolik yuz berdi." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card flex flex-col h-[520px]">
      <div className="p-4 border-b flex items-center gap-2">
        <Sparkles size={16} className="text-violet-600" />
        <h3 className="text-sm font-semibold">🤖 AI Admin Assistant</h3>
        <span className="text-xs text-muted-foreground ml-auto">faqat DB ma'lumotlari asosida</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Misol savollar:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>&quot;Bu oy eng ko&apos;p o&apos;qilgan 5 ta kitob qaysilar?&quot;</li>
              <li>&quot;Qaysi kategoriya eng mashhur?&quot;</li>
              <li>&quot;Bugun nechta faol o&apos;quvchi bor?&quot;</li>
            </ul>
          </div>
        ) : (
          history.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-2 max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.role === "user" ? <User size={14} className="shrink-0 mt-0.5" /> : <Bot size={14} className="shrink-0 mt-0.5" />}
                <span className="whitespace-pre-wrap">{m.text}</span>
              </div>
            </div>
          ))
        )}
        {loading && <p className="text-sm text-muted-foreground">AI o'ylamoqda...</p>}
      </div>

      <div className="p-3 border-t flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Savol yozing..."
          onKeyDown={(e) => e.key === "Enter" && ask()}
          className="flex-1"
        />
        <Button onClick={ask} disabled={loading} className="gap-1">
          <Send size={14} /> Yuborish
        </Button>
      </div>
      <p className="px-4 pb-2 text-[11px] text-muted-foreground">AI faqat mavjud ma'lumotlarga asoslanadi, uydirma qilmaydi.</p>
    </div>
  );
}
