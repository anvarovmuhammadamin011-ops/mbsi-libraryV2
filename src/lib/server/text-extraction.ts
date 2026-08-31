import { readPrivate } from "./storage";

export type ExtractedPage = {
  page: number;
  text: string;
};

export type ExtractionResult = {
  bookId: string;
  totalPages: number;
  pages: ExtractedPage[];
  fullText: string;
};

export async function extractTextFromPdf(pdfKey: string): Promise<ExtractionResult> {
  const buffer = await readPrivate(pdfKey);
  const data = new Uint8Array(buffer);

  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  const pages: ExtractedPage[] = [];
  const textParts: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    pages.push({ page: i, text: pageText });
    textParts.push(pageText);
  }

  return {
    bookId: "",
    totalPages,
    pages,
    fullText: textParts.join("\n\n"),
  };
}

export function chunkText(text: string, maxChunkSize: number = 4000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = "";

  for (const para of paragraphs) {
    if (currentChunk.length + para.length + 2 > maxChunkSize) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = para;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}
