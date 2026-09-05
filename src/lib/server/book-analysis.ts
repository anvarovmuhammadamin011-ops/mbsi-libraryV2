import { chunkText } from "./text-extraction";
import { aiChat } from "./ai-client";

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

const ANALYSIS_SYSTEM = `Sen kitob tahlilchisan. Kitob matnini tahlil qilib, muhim joylarni ajrat.
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
2. Har bir highlight uchun aniq sabab yoz
3. Muhimlik darajasini to'g'ri belgila
4. Mundarija sahifalar raqamini kiriting`;

function parseJSON<T>(response: string): T | null {
  const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    // Try to repair truncated JSON (e.g. missing closing brace)
    let candidate = jsonMatch[0];
    if (!candidate.endsWith("}") && !candidate.endsWith("]")) {
      candidate += candidate.startsWith("[") ? "]" : "}";
      try {
        return JSON.parse(candidate);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function analyzeBookContent(
  fullText: string,
  pages: { page: number; text: string }[]
): Promise<AnalysisResult> {
  const chunks = chunkText(fullText, 4000);
  const allHighlights: HighlightedSection[] = [];
  const allKeyPoints: string[] = [];
  let summary = "";
  let tableOfContents: { title: string; page: number }[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const prompt = `Kitob matnining ${i + 1}-qismi:\n\n${chunks[i]}

Shu qismni tahlil qilib, muhim joylarni ajrat.`;

    try {
      const response = await aiChat(
        [
          { role: "system", content: ANALYSIS_SYSTEM },
          { role: "user", content: prompt },
        ],
        { temperature: 0.3 }
      );
      const parsed = parseJSON<{
        summary?: string;
        keyPoints?: string[];
        highlights?: HighlightedSection[];
        tableOfContents?: { title: string; page: number }[];
      }>(response);

      if (parsed) {
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

  // If the book is large, ask for a final merged summary from the analysis
  // of all chunks (better than just the first chunk's summary).
  if (chunks.length > 1 && !summary && allKeyPoints.length > 0) {
    try {
      const finalPrompt = `Kitob quyidagi asosiy fikrlardan iborat (har bir qismdan):
${allKeyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Shu asosiy fikrlar asosida kitobning umumiy xulosasini yoz (3-5 gap). Faqat xulosa matnini qaytar.`;
      summary = await aiChat(
        [
          { role: "system", content: "Sen kitob xulosachisan. Faqat xulosa matnini yoz." },
          { role: "user", content: finalPrompt },
        ],
        { temperature: 0.4 }
      );
    } catch (e) {
      console.error("Umumiy xulosa xatosi:", e);
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

  // For small books just summarize the whole thing; for large ones,
  // summarize each chunk and then merge.
  if (chunks.length <= 2) {
    const prompt = `Quyidagi kitob matnini xulosa qil:\n\n${chunks.join("\n\n")}`;
    return aiChat(
      [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
      { temperature: 0.4, maxTokens: 2000 }
    );
  }

  // Large book: per-chunk short summaries, then merge.
  const partSummaries: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    try {
      const prompt = `Quyidagi kitob matnining ${i + 1}-qismini 2-3 gapda xulosa qil:\n\n${chunks[i]}`;
      const part = await aiChat(
        [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt },
        ],
        { temperature: 0.4, maxTokens: 1500 }
      );
      partSummaries.push(part);
    } catch (e) {
      console.error(`Xulosa xatosi (qism ${i + 1}):`, e);
    }
  }

  if (partSummaries.length === 0) return "Xulosa tayyorlanmadi";

  const mergePrompt = `Kitobning har bir qismi uchun quyidagi xulosalar tayyor:
${partSummaries.map((s, i) => `Qism ${i + 1}: ${s}`).join("\n")}

Endi butun kitob uchun bitta umumiy xulosa yoz (3-5 gap). Faqat xulosa matnini qaytar.`;

  return aiChat(
    [
      { role: "system", content: systemMessage },
      { role: "user", content: mergePrompt },
    ],
    { temperature: 0.4, maxTokens: 2000 }
  );
}

export async function extractKeyTerms(fullText: string): Promise<string[]> {
  const systemMessage = `Kitob matnidan asosiy atamalar va tushunchalarni ajrat.
Faqat atamalar ro'yxatini JSON formatida qaytar: ["atama1", "atama2", ...]
Maksimum 20 ta atama.`;

  const chunks = chunkText(fullText, 3000);
  const allTerms = new Set<string>();

  // Sample up to 3 chunks (first, middle, last) to cover the whole book.
  const sampleIndices = new Set<number>([0]);
  if (chunks.length > 1) sampleIndices.add(Math.floor(chunks.length / 2));
  if (chunks.length > 2) sampleIndices.add(chunks.length - 1);

  for (const i of Array.from(sampleIndices).slice(0, 3)) {
    try {
      const prompt = `Quyidagi matndan asosiy atamalarni ajrat (maksimum 20):\n\n${chunks[i]}`;
      const response = await aiChat(
        [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt },
        ],
        { temperature: 0.3, maxTokens: 1500 }
      );
      const parsed = parseJSON<string[]>(response);
      if (Array.isArray(parsed)) {
        parsed.forEach((t) => allTerms.add(t));
      }
    } catch (e) {
      console.error("Atama ajratish xatosi:", e);
    }
  }

  return Array.from(allTerms).slice(0, 20);
}