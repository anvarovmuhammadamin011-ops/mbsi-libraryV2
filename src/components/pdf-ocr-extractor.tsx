"use client";

/**
 * AI-powered PDF text extractor.
 *
 * Renders each PDF page in the browser canvas, then sends the images
 * to the server-side AI vision model for text extraction.
 * Much better quality than tesseract.js OCR.
 *
 * When autoStart is true, extraction begins immediately on mount.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";

interface Props {
  bookId: string;
  pdfUrl?: string;
  totalPages: number;
  autoStart?: boolean;
  onComplete?: (textLength: number) => void;
}

// One page per AI call — keeps requests under the free-tier provider
// rate limits (429). Pages are processed sequentially.
const BATCH_SIZE = 1;

export function PdfOcrExtractor({
  bookId,
  pdfUrl,
  totalPages,
  autoStart = false,
  onComplete,
}: Props) {
  const [status, setStatus] = useState<
    "idle" | "loading-pdf" | "extracting" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [extractedLength, setExtractedLength] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef(false);
  const startedRef = useRef(false);
  const extractedLengthRef = useRef(0);

  const runExtraction = useCallback(async () => {
    if (!pdfUrl) {
      setStatus("error");
      setErrorMsg("PDF manzili topilmadi");
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    abortRef.current = false;
    setStatus("loading-pdf");
    setProgress(0);
    setCurrentPage(0);
    setErrorMsg("");

    try {
      // Load PDF in browser
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc =
        "/pdf-worker/pdf.worker.min.mjs";

      setStatus("loading-pdf");
      const doc = await pdfjs.getDocument({ url: pdfUrl }).promise;
      const total = doc.numPages;

      setStatus("extracting");

      // Process pages in batches
      for (let batchStart = 1; batchStart <= total; batchStart += BATCH_SIZE) {
        if (abortRef.current) {
          startedRef.current = false;
          setStatus("idle");
          return;
        }

        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, total);
        const batchImages: { page: number; imageData: string }[] = [];

        // Render batch pages to canvas
        for (let i = batchStart; i <= batchEnd; i++) {
          setCurrentPage(i);
          setProgress(Math.round(((i - 1) / total) * 100));

          try {
            const page = await doc.getPage(i);
            // Scale 1.0 keeps images small enough for the AI provider's
            // input-token limits while staying readable for extraction.
            const viewport = page.getViewport({ scale: 1.0 });

            const canvas = document.createElement("canvas");
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            const ctx = canvas.getContext("2d")!;

            // White background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            await page.render({ canvasContext: ctx, viewport }).promise;

            const imageData = canvas.toDataURL("image/png");
            batchImages.push({ page: i, imageData });

            // Free canvas memory
            canvas.width = 0;
            canvas.height = 0;
          } catch (err) {
            console.error(`Failed to render page ${i}:`, err);
            batchImages.push({ page: i, imageData: "" });
          }
        }

        // Send batch to AI extraction API
        try {
          const res = await fetch(`/api/books/${bookId}/content/ai-extract`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pages: batchImages,
              // Later batches append to the text saved by earlier ones
              append: batchStart > 1,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(
              errData?.error || `Server xatosi: ${res.status}`
            );
          }

          const result = await res.json();
          if (result.data?.textLength) {
            extractedLengthRef.current = result.data.textLength;
            setExtractedLength(extractedLengthRef.current);
          }
        } catch (err: any) {
          console.error(`AI extraction batch failed:`, err);
          // Continue with next batch - don't abort entire process
          toast.error(
            `Sahifalar ${batchStart}-${batchEnd} uchun xatolik: ${err.message}`
          );
        }
      }

      // Done
      setProgress(100);
      setStatus("done");

      toast.success("Matn AI orqali ajratildi!");
      onComplete?.(extractedLengthRef.current);
    } catch (err: any) {
      console.error("AI extraction error:", err);
      setStatus("error");
      setErrorMsg(err.message || "Noma'lum xato");
      toast.error("AI matn ajratishda xatolik");
      startedRef.current = false;
    }
  }, [bookId, pdfUrl, totalPages, onComplete]);

  // Auto-start extraction on mount
  useEffect(() => {
    if (autoStart && pdfUrl && status === "idle" && !startedRef.current) {
      runExtraction();
    }
  }, [autoStart, pdfUrl, status, runExtraction]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  return (
    <div className="space-y-3">
      {status === "idle" && !autoStart && (
        <Button onClick={runExtraction} className="gap-2" variant="outline">
          <Zap size={16} />
          AI orqali matn ajratish
        </Button>
      )}

      {(status === "loading-pdf" || status === "extracting") && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {status === "loading-pdf"
              ? "PDF yuklanmoqda..."
              : `Sahifa ${currentPage} / ${totalPages} — ${progress}% — AI ishlayapti...`}
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Sahifalar rasmi AI vision modelga yuborilmoqda...
          </p>
        </div>
      )}

      {status === "done" && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="size-4" />
          AI matn ajratildi! {extractedLength.toLocaleString()} belgi
        </div>
      )}

      {status === "error" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {errorMsg}
          </div>
          <Button
            onClick={() => {
              startedRef.current = false;
              runExtraction();
            }}
            variant="outline"
            size="sm"
          >
            Qayta urinish
          </Button>
        </div>
      )}
    </div>
  );
}
