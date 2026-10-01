/**
 * Manual test for the AI book-text extraction pipeline.
 *
 * Renders a page image (provided as base64 PNG) and sends it through
 * the same aiExtractPages() code that the /api/books/[id]/content/ai-extract
 * route uses. Prints what the vision model returns.
 *
 * Usage: npx tsx scripts/test-ai-extract.ts <imagePath>
 */
import { readFileSync } from "node:fs";
import { aiExtractPages, getAIProvider, getAIVisionModel, hasAIKey } from "../src/lib/server/ai-client";

// Load env vars from .env.local (Next.js auto-loads this; plain tsx does not)
function loadEnvFile(path: string) {
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      value = value.replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // ignore missing file
  }
}
loadEnvFile(".env.local");
loadEnvFile(".env");

async function main() {
  const imagePath = process.argv[2] || ".tmp-ai-test/page.png";

  console.log("=== AI extraction test ===");
  console.log("Provider:", getAIProvider());
  console.log("Vision model:", getAIVisionModel());
  console.log("Has AI key:", hasAIKey());
  if (!hasAIKey()) {
    console.error("FAIL: AI_API_KEY is not set");
    process.exit(1);
  }

  const buf = readFileSync(imagePath);
  const imageData = `data:image/png;base64,${buf.toString("base64")}`;
  console.log(`Image: ${imagePath} (${buf.length} bytes)`);
  console.log("");

  const start = Date.now();
  try {
    const results = await aiExtractPages([{ page: 1, imageData }]);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    const text = results[0] || "";
    console.log(`Time: ${elapsed}s`);
    console.log(`Extracted chars: ${text.length}`);
    console.log("----------------------------------------");
    console.log(text);
    console.log("----------------------------------------");

    const expected = ["Aziz", "kitob", "Kuz"].filter((w) =>
      text.toLowerCase().includes(w.toLowerCase())
    );
    const ok = text.trim().length > 50 && expected.length >= 2;
    console.log("");
    console.log(ok ? "✅ AI extraction WORKS" : "❌ AI extraction FAILED");
    console.log(`Matched expected words: ${expected.length}/3 (${expected.join(", ") || "none"})`);
    process.exit(ok ? 0 : 1);
  } catch (err: unknown) {
    console.error("❌ AI extraction threw an error:");
    console.error((err as Error)?.message ?? err);
    process.exit(1);
  }
}

main();