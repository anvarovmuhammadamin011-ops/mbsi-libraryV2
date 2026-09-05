import { route, json, readJson } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";
import { aiChat, hasAIKey } from "@/lib/server/ai-client";

type AssistAction = "explain" | "summarize" | "define" | "ask";

const SYSTEM_PROMPT = `Sen MBSI Library AI yordamchisisan. Faqat berilgan matn asosida javob ber, uydirma ma'lumot berma. O'zbek tilida, sodda va tushunarli javob ber.`;

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

  if (!hasAIKey()) {
    throw new ApiError(ERROR_CODES.INTERNAL, "AI sozlanmagan. Iltimos administratorga murojaat qiling.", 500);
  }

  try {
    const promptMap: Record<AssistAction, string> = {
      explain: `Matnni oddiy tilda tushuntir:\n\n${text}`,
      summarize: `Quyidagi matnni 2-3 gapda xulosa qil:\n\n${text}`,
      define: `Quyidagi so'z/iboraning ta'rifini ber (kontekst: "${text.slice(0, 200)}"):\n\n${text}`,
      ask: `Matn: "${text}"\nSavol: "${question}"\n\nFaqat berilgan matn asosida javob ber, uydirma qilma.`,
    };
    const answer = await aiChat(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: promptMap[action] },
      ],
      { temperature: 0.3, maxTokens: 1024 }
    );
    return json({ success: true, data: { answer, source: "ai" } });
  } catch (e: any) {
    throw new ApiError(ERROR_CODES.INTERNAL, e.message || "AI xatolik", 500);
  }
});