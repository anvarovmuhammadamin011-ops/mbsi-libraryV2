import { chunkText } from "./text-extraction";

export type TranslationResult = {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
};

async function callOpenAI(prompt: string, systemMessage: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY topilmadi");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
      max_tokens: 4000,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenAI API xatosi: ${error}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function translateToUzbek(text: string): Promise<TranslationResult> {
  const systemMessage = `Sen professional tarjimansan. Matnni o'zbek tiliga tarjima qil.
Qoidalar:
1. Matnni to'liq va aniq tarjima qil
2. Maxsus atamalar va nomlarni saqlab qol
3. Tarjima tabiiy va tushunarli bo'lsin
4. Faqat tarjima qil, qo'shimcha tushuntirish berma`;

  const chunks = chunkText(text, 3000);
  const translatedChunks: string[] = [];

  for (const chunk of chunks) {
    const prompt = `Quyidagi matnni o'zbek tiliga tarjima qil:\n\n${chunk}`;
    const translated = await callOpenAI(prompt, systemMessage);
    translatedChunks.push(translated);
  }

  return {
    originalText: text,
    translatedText: translatedChunks.join("\n\n"),
    sourceLanguage: "auto",
    targetLanguage: "uz",
  };
}

export async function translateFromUzbek(
  text: string,
  targetLang: string = "en"
): Promise<TranslationResult> {
  const langNames: Record<string, string> = {
    en: "ingliz",
    ru: "rus",
    uz: "o'zbek",
  };

  const systemMessage = `Sen professional tarjimansan. Matnni ${langNames[targetLang] || targetLang} tiliga tarjima qil.
Qoidalar:
1. Matnni to'liq va aniq tarjima qil
2. Maxsus atamalar va nomlarni saqlab qol
3. Tarjima tabiiy va tushunarli bo'lsin`;

  const chunks = chunkText(text, 3000);
  const translatedChunks: string[] = [];

  for (const chunk of chunks) {
    const prompt = `Quyidagi o'zbek matnini ${langNames[targetLang] || targetLang} tiliga tarjima qil:\n\n${chunk}`;
    const translated = await callOpenAI(prompt, systemMessage);
    translatedChunks.push(translated);
  }

  return {
    originalText: text,
    translatedText: translatedChunks.join("\n\n"),
    sourceLanguage: "uz",
    targetLanguage,
  };
}
