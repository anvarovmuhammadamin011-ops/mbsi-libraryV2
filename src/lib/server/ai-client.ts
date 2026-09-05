// Unified AI client — supports Groq (free) and OpenAI.
// Provider is chosen via env vars:
//   AI_PROVIDER = "groq" | "openai"   (default: groq)
//   AI_API_KEY  = API key
//   AI_MODEL    = model name (optional, provider default used otherwise)
//
// Groq is OpenAI-compatible, so both providers use the same chat
// completions request shape.

export interface AIOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string | AIMessageContent[];
}

/**
 * Multimodal content item — text or image (base64 data URI or URL).
 * Used for vision / image-based extraction.
 */
export type AIMessageContent =
  | { type: "text"; text: string }
  | {
      type: "image_url";
      image_url: { url: string; detail?: "low" | "high" | "auto" };
    };

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export function getAIProvider(): "groq" | "openai" {
  return (process.env.AI_PROVIDER || "groq") === "openai" ? "openai" : "groq";
}

export function getAIModel(): string {
  const provider = getAIProvider();
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  return provider === "openai" ? "gpt-4o-mini" : "openai/gpt-oss-120b";
}

export function hasAIKey(): boolean {
  return Boolean(process.env.AI_API_KEY || process.env.OPENAI_API_KEY);
}

export function getAIKey(): string {
  return process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
}

export function getAIUrl(): string {
  return getAIProvider() === "openai" ? OPENAI_URL : GROQ_URL;
}

/**
 * Vision-capable model:
 * - OpenAI: gpt-4o-mini
 * - Groq: qwen2.5-coder-32b doesn't do vision — use the qwen
 *   family which accepts image_url inputs (qwen3.x-27b).
 */
export function getAIVisionModel(): string {
  return getAIProvider() === "openai" ? "gpt-4o-mini" : "qwen/qwen3.8-27b";
}

/**
 * fetch with retry on 429 rate limits.
 * Uses the provider's "try again in Xs" hint when available, capped at 90s.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 4
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init);
    if (res.status === 429 && attempt < maxRetries) {
      const body = await res.text().catch(() => "");
      let waitSec = 20 + attempt * 15;
      const match = body.match(/try again in ([\d.]+)s/i);
      if (match) waitSec = Math.min(parseFloat(match[1]) + 5, 90);
      console.warn(
        `[ai-client] Rate limit (429), retrying in ${waitSec.toFixed(0)}s (attempt ${attempt + 1}/${maxRetries})`
      );
      await new Promise((r) => setTimeout(r, waitSec * 1000));
      continue;
    }
    return res;
  }
}

/**
 * Calls the chat-completions endpoint of the configured provider.
 * Returns the assistant message text. Throws on error.
 */
export async function aiChat(
  messages: AIMessage[],
  opts: AIOptions = {}
): Promise<string> {
  const key = getAIKey();
  if (!key) throw new Error("AI_API_KEY topilmadi");

  const provider = getAIProvider();
  const url = provider === "openai" ? OPENAI_URL : GROQ_URL;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: opts.model || getAIModel(),
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI so'rov xatosi (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("AI javobi noto'g'ri");
  return text;
}

/**
 * Extract text from page images using AI vision model.
 * Accepts an array of base64 data-URI page images and returns
 * the extracted text for each page.
 */
export async function aiExtractPages(
  pageImages: { page: number; imageData: string }[],
  opts: { maxTokens?: number } = {}
): Promise<string[]> {
  const key = getAIKey();
  if (!key) throw new Error("AI_API_KEY topilmadi");

  const provider = getAIProvider();
  const url = provider === "openai" ? OPENAI_URL : GROQ_URL;
  const model = getAIVisionModel();

  // Build multimodal content: system prompt + all page images
  const content: AIMessageContent[] = [
    {
      type: "text",
      text: `Bu PDF sahifalarining rasmlari. Har bir sahifadagi matnni to'liq va aniq chiqarib ber.
Qoidalar:
- Faqat sahifadagi haqiqiy matnni chiqar (watermark, header, footer emas)
- Paragraflarni ajratib yoz
- Sahifa raqamini chiqarma
- Matnni original tilida saqla
- Formatlash: paragraflar orasida bo'sh qator qoldir`,
    },
  ];

  for (const pi of pageImages) {
    content.push({
      type: "text",
      text: `--- Sahifa ${pi.page} ---`,
    });
    content.push({
      type: "image_url",
      image_url: { url: pi.imageData, detail: "high" },
    });
  }

  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content }],
      temperature: 0.1,
      max_tokens: opts.maxTokens ?? 4096,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI extraction xatosi (${res.status}): ${body.slice(0, 500)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("AI javobi noto'g'ri");

  // Split the response back into per-page sections
  const sections = text.split(/---\s*Sahifa\s+\d+\s*---/);
  const results: string[] = [];
  for (let i = 0; i < pageImages.length; i++) {
    const section = sections[i + 1] ?? sections[sections.length - 1] ?? "";
    results.push(section.trim());
  }

  return results;
}