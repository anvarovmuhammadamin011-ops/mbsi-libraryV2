import { chunkText } from "./text-extraction";
import { aiChat } from "./ai-client";

export type TranslationResult = {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
};

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
    const translated = await aiChat(
      [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
      { temperature: 0.3 }
    );
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
    const translated = await aiChat(
      [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
      { temperature: 0.3 }
    );
    translatedChunks.push(translated);
  }

  return {
    originalText: text,
    translatedText: translatedChunks.join("\n\n"),
    sourceLanguage: "uz",
    targetLanguage: targetLang,
  };
}