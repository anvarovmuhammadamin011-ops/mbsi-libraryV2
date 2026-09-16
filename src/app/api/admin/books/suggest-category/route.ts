import { route } from "@/lib/server/handler";
import { requireBookManager } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { success } from "@/lib/server/errors";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ʻ'‘’]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  return normalize(s)
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

async function matchExisting(text: string): Promise<{ id: string; name: string } | null> {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });
  const catTokens = categories.map((c) => ({
    id: c.id,
    name: c.name,
    tokens: new Set(tokenize(c.name)),
  }));

  let best: { id: string; name: string; score: number } | null = null;

  // 1) To'liq/so'zma-so'z moslik
  const exact = categories.find((c) => normalize(c.name) === normalize(text));
  if (exact) return { id: exact.id, name: exact.name };

  // 2) Token qoplash (eng katta ulushli kategoriya)
  const queryTokens = tokenize(text);
  for (const c of catTokens) {
    if (c.tokens.size === 0) continue;
    let overlap = 0;
    for (const t of queryTokens) if (c.tokens.has(t)) overlap += 1;
    if (overlap === 0) continue;
    const score = overlap / Math.max(queryTokens.length, 1);
    if (!best || score > best.score) {
      best = { id: c.id, name: c.name, score };
    }
  }
  if (best && best.score >= 0.5) return { id: best.id, name: best.name };
  return null;
}

export const POST = route(async (req) => {
  await requireBookManager();

  let title = "";
  let author = "";
  try {
    const body = await req.json();
    title = String(body?.title ?? "");
    author = String(body?.author ?? "");
  } catch {
    // ignore malformed body
  }

  const combined = [title, author].filter(Boolean).join(" ").trim();
  if (!combined) {
    return success({ isExisting: false, name: "" }, 200);
  }

  let suggested = "";

  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || "openai/gpt-oss-120b";
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: 30,
          messages: [
            {
              role: "system",
              content:
                "Siz kutubxona katalogizatorisiz. Berilgan kitob sarlavhasi va muallifi uchun BIRTA qisqa kategoriya nomini qaytaring (faqatgina nom, boshqa matnsiz). Misol: 'Ilmiy fantastika', 'Bolalar adabiyoti', 'Tarix', 'Detektiv', 'O'zbek adabiyoti'.",
            },
            {
              role: "user",
              content: `Kitob: "${title}"${author ? `, muallif: ${author}` : ""}`,
            },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const content: string =
          data?.choices?.[0]?.message?.content?.trim() ?? "";
        suggested = content
          .replace(/^["']+|["']+$/g, "")
          .replace(/[.\n]+$/, "")
          .trim()
          .slice(0, 60);
      }
    } catch (err) {
      console.error("AI category suggestion failed:", err);
    }
  }

  const name = suggested || title.split(" ")[0] || "";

  const found = name ? await matchExisting(name) : null;
  if (found) {
    return success({ isExisting: true, categoryId: found.id, name: found.name }, 200);
  }
  return success({ isExisting: false, name }, 200);
});