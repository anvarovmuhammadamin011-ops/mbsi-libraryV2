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

export type ExtractionOptions = {
  limitPages?: number;
};

/**
 * Check if extracted text is mostly watermark / junk.
 */
function isJunkText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 50) return true;

  const lines = trimmed
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return true;

  const uniqueLines = new Set(lines.map((l) => l.toLowerCase()));
  const uniqueRatio = uniqueLines.size / lines.length;

  if (uniqueRatio < 0.2 && lines.length > 5) return true;

  const lineFreq: Record<string, number> = {};
  for (const line of lines) {
    const key = line.toLowerCase().substring(0, 60);
    lineFreq[key] = (lineFreq[key] || 0) + 1;
  }
  const mostCommon = Object.values(lineFreq).sort((a, b) => b - a)[0] || 0;
  if (mostCommon / lines.length > 0.5 && lines.length > 5) return true;

  const avgLen = trimmed.length / lines.length;
  if (avgLen < 20 && lines.length > 10) return true;

  return false;
}

/**
 * Extract text from a PDF file using pdfjs-dist.
 *
 * For image-based / scanned PDFs where standard text extraction yields
 * only watermark or junk text, the result will have empty page texts.
 * The client-side PdfOcrExtractor component handles OCR for these cases.
 */
export async function extractTextFromPdf(
  pdfKey: string,
  _options: ExtractionOptions = {}
): Promise<ExtractionResult> {
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

  const fullText = textParts.join("\n\n");

  // If text is junk (e.g., watermark-only), return empty texts
  // so the client-side OCR can take over
  if (isJunkText(fullText)) {
    console.log(
      `[text-extraction] Detected junk text (${fullText.length} chars) — client-side OCR should be used`
    );
    await pdfDoc.destroy();
    return {
      bookId: "",
      totalPages,
      pages: pages.map((p) => ({ page: p.page, text: "" })),
      fullText: "",
    };
  }

  await pdfDoc.destroy();
  return {
    bookId: "",
    totalPages,
    pages,
    fullText,
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
