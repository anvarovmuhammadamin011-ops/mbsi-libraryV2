import { chunkText } from "./text-extraction";

export type HighlightedSection = {
  text: string;
  importance: "high" | "medium" | "low";
  reason: string;
  category: "definition" | "example" | "key-concept" | "formula" | "summary" | "other";
};

export type AnalysisResult = {
  bookId: string;
  summary: string;
  keyPoints: string[];
  highlights: HighlightedSection[];
  tableOfContents: { title: string; page: number }[];
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

export async function analyzeBookContent(
  fullText: string,
  pages: { page: number; text: string }[]
): Promise<AnalysisResult> {
  const systemMessage = `Sen kitob tahlilchisan. Kitob matnini tahlil qilib, muhim joylarni ajrat.
JSON formatida javob ber:

{
  "summary": "Kitobning umumiy xulosa (2-3 gap)",
  "keyPoints": ["Asosiy fikr 1", "Asosiy fikr 2", ...],
  "highlights": [
    {
      "text": "Muhim matn",
      "importance": "high/medium/low",
      "reason": "Nega muhim",
      "category": "definition/example/key-concept/formula/summary/other"
    }
  ],
  "tableOfContents": [
    {"title": "Sarlavha", "page": 1}
  ]
}

Qoidalar:
1. Faqat JSON qaytar, boshqa hech narsa yozma
2. Har bir.highlight uchun aniq sabab yoz
3. Muhimlik darajasini to'g'ri belgila
4. Mundarija sahifalar raqamini kiriting`;

  const chunks = chunkText(fullText, 4000);
  const allHighlights: HighlightedSection[] = [];
  const allKeyPoints: string[] = [];
  let summary = "";
  let tableOfContents: { title: string; page: number }[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const prompt = `Kitob matnining ${i + 1}-qismi:\n\n${chunks[i]}

Shu qismni tahlil qilib, muhim joylarni ajrat.`;

    try {
      const response = await callOpenAI(prompt, systemMessage);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.summary && !summary) summary = parsed.summary;
        if (parsed.keyPoints) allKeyPoints.push(...parsed.keyPoints);
        if (parsed.highlights) allHighlights.push(...parsed.highlights);
        if (parsed.tableOfContents && tableOfContents.length === 0) {
          tableOfContents = parsed.tableOfContents;
        }
      }
    } catch (e) {
      console.error(`Tahlil xatosi (qism ${i + 1}):`, e);
    }
  }

  return {
    bookId: "",
    summary: summary || "Xulosa hali tayyorlanmagan",
    keyPoints: allKeyPoints.slice(0, 10),
    highlights: allHighlights.slice(0, 20),
    tableOfContents,
  };
}

export async function generateBookSummary(fullText: string): Promise<string> {
  const systemMessage = `Sen kitob xulosachisan. Kitob matnini o'qib, qisqacha va aniq xulosa tayyorla.
Xulosa:
- 3-5 gapdan iborat bo'lsin
- Asosiy g'oyani aks ettirsin
- O'zbek tilida yozilsin
- Faqat xulosa matnini qaytar, boshqa hech narsa yozma`;

  const chunks = chunkText(fullText, 4000);
  const prompt = `Quyidagi kitob matnini xulosa qil:\n\n${chunks[0]}

${chunks.length > 1 ? "... (umumiy " + chunks.length + " qism)" : ""}`;

  return callOpenAI(prompt, systemMessage);
}

export async function extractKeyTerms(fullText: string): Promise<string[]> {
  const systemMessage = `Kitob matnidan asosiy atamalar va tushunchalarni ajrat.
Faqat atamalar ro'yxatini JSON formatida qaytar: ["atama1", "atama2", ...]
Maksimum 20 ta atama.`;

  const chunks = chunkText(fullText, 3000);
  const prompt = `Quyidagi matndan asosiy atamalarni ajrat:\n\n${chunks[0]}`;

  try {
    const response = await callOpenAI(prompt, systemMessage);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Atama ajratish xatosi:", e);
  }

  return [];
}
