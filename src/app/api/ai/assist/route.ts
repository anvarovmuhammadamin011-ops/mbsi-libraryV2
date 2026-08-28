import { route, json, readJson } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

type AssistAction = "explain" | "summarize" | "define" | "ask";

function mockAssist(action: AssistAction, text: string, question?: string): string {
  const short = text.slice(0, 120);
  switch (action) {
    case "explain":
      return `✨ **Oddiy tilda tushuntirish:**\n\n"${short}..." — bu matn ${text.length > 100 ? "murakkab g'oyani soddalashtiradi" : "asosiy fikrni ifodalaydi"}. Muallif bu yerda o'qinchini tushunishga yordam berish uchun misollar keltiradi.`;
    case "summarize":
      return `📝 **Qisqacha xulosa:**\n\n${text.split(".").slice(0, 2).join(". ")}. Ushbu qism kitobning asosiy g'oyasini ochadi.`;
    case "define":
      return `📖 **Ta'rif:**\n\n"${short}" — tanlangan so'z/ibora matnda muhim atama sifatida ishlatilgan. Kontekstga ko'ra u asosiy tushunchani anglatadi. To'liq ta'rif uchun lug'atga qarang.`;
    case "ask":
      return `❓ **Savol:** ${question ?? ""}\n\n**Javob (matn asosida):**\n\n"${short}..." matniga asoslanib, bu savolga javob kitobning ushbu qismida yoritilgan. Matnni diqqat bilan o'qing va asosiy g'oyani ajrating.`;
    default:
      return text.slice(0, 300);
  }
}

export const POST = route(async (req) => {
  await requireUser();
  const body = await readJson<{ action: AssistAction; text: string; question?: string }>(req);
  const { action, text, question } = body;
  if (!action || !["explain", "summarize", "define", "ask"].includes(action)) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri action", 400);
  }
  if (!text || text.trim().length < 3) throw new ApiError(ERROR_CODES.VALIDATION, "Matn juda qisqa", 400);
  if (text.length > 5000) throw new ApiError(ERROR_CODES.VALIDATION, "Matn juda uzun (max 5000)", 400);
  if (action === "ask" && (!question || question.trim().length < 3)) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Savol kiriting", 400);
  }

  // Try real LLM if key exists, fallback to mock
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const promptMap: Record<AssistAction, string> = {
        explain: `Matnni oddiy tilda tushuntir:\n\n${text}`,
        summarize: `Quyidagi matnni 2-3 gapda xulosa qil:\n\n${text}`,
        define: `Quyidagi so'z/iboraning ta'rifini ber (kontekst: "${text.slice(0, 200)}"):\n\n${text}`,
        ask: `Matn: "${text}"\nSavol: "${question}"\n\nFaqat berilgan matn asosida javob ber, uydirma qilma.`,
      };
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Sen MBSI Library AI yordamchisisan. Faqat berilgan matn asosida javob ber, uydirma ma'lumot berma. O'zbek tilida, sodda va tushunarli javob ber." },
            { role: "user", content: promptMap[action] },
          ],
          max_tokens: 400,
          temperature: 0.3,
        }),
      });
      if (res.ok) {
        const data: any = await res.json();
        const answer = data.choices?.[0]?.message?.content?.trim();
        if (answer) return json({ success: true, data: { answer, source: "ai" } });
      }
    } catch (e) {
      console.error("AI assist LLM failed, fallback to mock", e);
    }
  }

  const answer = mockAssist(action, text, question);
  return json({ success: true, data: { answer, source: "mock" } });
});
