"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  Languages,
  Sparkles,
  BookOpen,
  List,
  Tag,
  ImageIcon,
} from "lucide-react";

interface BookContent {
  status: string;
  hasImages?: boolean;
  imageCount?: number;
  summary?: string;
  keyPoints?: string[];
  highlights?: {
    text: string;
    importance: string;
    reason: string;
    category: string;
  }[];
  tableOfContents?: { title: string; page: number }[];
  keyTerms?: string[];
}

interface FullContent {
  text?: string;
}

interface Props {
  bookId: string;
  isAdmin?: boolean;
}

/**
 * Parse translated text for [IMAGE:P:i] markers and render them as
 * inline images alongside the text segments.
 */
function renderTranslatedText(
  text: string,
  extractedImages: { page: number; index: number; dataUrl?: string }[],
  bookId: string
) {
  // Split on [IMAGE:P:i] markers
  const parts = text.split(/(\[IMAGE:\d+:\d+\])/g);

  return parts.map((part, i) => {
    const match = part.match(/\[IMAGE:(\d+):(\d+)\]/);
    if (match) {
      const page = parseInt(match[1], 10);
      const index = parseInt(match[2], 10);
      const img = extractedImages.find((e) => e.page === page && e.index === index);
      const src = img?.dataUrl;

      if (src) {
        return (
          <div key={i} className="my-3 flex justify-center">
            <img
              src={src}
              alt={`Sahifa ${page}, rasm ${index + 1}`}
              className="max-w-full max-h-48 object-contain rounded-lg border border-border"
            />
          </div>
        );
      }
      // Placeholder when image not loaded yet
      return (
        <div key={i} className="my-2 flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon size={12} />
          <span>[Rasm: sahifa {page}]</span>
        </div>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function BookContentView({ bookId, isAdmin = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<BookContent | null>(null);
  const [fullText, setFullText] = useState<string>("");
  const [translation, setTranslation] = useState<string>("");
  const [activeTab, setActiveTab] = useState("summary");
  const [images, setImages] = useState<
    { page: number; index: number; width: number; height: number; dataUrl?: string }[]
  >([]);

  useEffect(() => {
    loadContent();
  }, [bookId]);

  async function loadContent() {
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${bookId}/content`);
      const data = await res.json();
      if (data.success && data.data) {
        setContent(data.data);
      }
    } catch (e) {
      console.error("Content load error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadFullText() {
    try {
      const res = await fetch(`/api/books/${bookId}/content?field=fullText`);
      const data = await res.json();
      if (data.success && data.data?.text) {
        setFullText(data.data.text);
      }
    } catch (e) {
      toast.error("Matnni yuklashda xatolik");
    }
  }

  async function loadTranslation() {
    try {
      const res = await fetch(`/api/books/${bookId}/content?field=translation`);
      const data = await res.json();
      if (data.success && data.data?.text) {
        setTranslation(data.data.text);
      }
    } catch (e) {
      toast.error("Tarjimani yuklashda xatolik");
    }
  }

  async function loadImages() {
    if (images.length > 0) return;
    try {
      const res = await fetch(`/api/books/${bookId}/extract`);
      const data = await res.json();
      if (data.success && data.data?.images) {
        // Load each image's dataUrl
        const loaded = await Promise.all(
          data.data.images.map(async (meta: any) => {
            try {
              const imgRes = await fetch(
                `/api/books/${bookId}/images?page=${meta.page}&index=${meta.index}`
              );
              const imgData = await imgRes.json();
              return {
                ...meta,
                dataUrl: imgData.success ? imgData.data?.dataUrl : undefined,
              };
            } catch {
              return { ...meta, dataUrl: undefined };
            }
          })
        );
        setImages(loaded);
      }
    } catch (e) {
      toast.error("Rasmlarni yuklashda xatolik");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!content || content.status !== "completed") {
    return null;
  }

  const importanceColors: Record<string, string> = {
    high: "bg-red-500/10 text-red-600 border-red-500/30",
    medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    low: "bg-green-500/10 text-green-600 border-green-500/30",
  };

  const categoryLabels: Record<string, string> = {
    definition: "Ta'rif",
    example: "Misol",
    "key-concept": "Asosiy tushuncha",
    formula: "Formula",
    summary: "Xulosa",
    other: "Boshqa",
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-primary" />
        <h3 className="font-medium">Kitob tahlili</h3>
        <Badge variant="secondary" className="text-xs">
          AI
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary" className="gap-1.5">
            <FileText size={14} />
            Xulosa
          </TabsTrigger>
          <TabsTrigger value="terms" className="gap-1.5">
            <Tag size={14} />
            Atamalar
          </TabsTrigger>
          <TabsTrigger value="highlights" className="gap-1.5">
            <Sparkles size={14} />
            Muhim joylar
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-1.5">
            <ImageIcon size={14} />
            Rasmlar
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-1.5">
            <BookOpen size={14} />
            Matn
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          {content.summary && (
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="text-sm font-medium mb-2">Xulosa</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {content.summary}
              </p>
            </div>
          )}

          {content.keyPoints && content.keyPoints.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="text-sm font-medium mb-2">
                Asosiy fikrlar ({content.keyPoints.length})
              </h4>
              <ul className="space-y-2">
                {content.keyPoints.map((point, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-primary mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {content.tableOfContents && content.tableOfContents.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <List size={14} />
                Mundarija
              </h4>
              <ul className="space-y-1">
                {content.tableOfContents.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-center justify-between"
                  >
                    <span>{item.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.page}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        {/* Terms Tab */}
        <TabsContent value="terms">
          {content.keyTerms && content.keyTerms.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {content.keyTerms.map((term, i) => (
                <Badge key={i} variant="secondary" className="text-sm">
                  {term}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Atamalar hali aniqlanmagan
            </p>
          )}
        </TabsContent>

        {/* Highlights Tab */}
        <TabsContent value="highlights">
          {content.highlights && content.highlights.length > 0 ? (
            <div className="space-y-3">
              {content.highlights.map((h, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 ${importanceColors[h.importance] || ""}`}
                >
                  <p className="text-sm mb-2">{h.text}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {categoryLabels[h.category] || h.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {h.reason}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Muhim joylar hali aniqlanmagan
            </p>
          )}
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-4">
          <Button
            variant="outline"
            onClick={loadImages}
            disabled={images.length > 0}
            className="gap-2"
          >
            <ImageIcon size={14} />
            {images.length > 0 ? `${images.length} ta rasm yuklandi` : "Rasmlarni yuklash"}
          </Button>

          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {images.map((img, i) => (
                <div key={i} className="rounded-lg bg-muted/50 overflow-hidden border border-border">
                  {img.dataUrl ? (
                    <img
                      src={img.dataUrl}
                      alt={`Sahifa ${img.page}, rasm ${i + 1}`}
                      className="w-full h-auto object-contain max-h-48"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-24">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <div className="px-3 py-1.5 flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px]">
                      Sahifa {img.page}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {img.width}×{img.height}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Rasmlarni ko'rish uchun "Rasmlarni yuklash" tugmasini bosing
            </p>
          )}
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={loadFullText}
              disabled={!!fullText}
              className="gap-2"
            >
              <FileText size={14} />
              {fullText ? "Yuklandi" : "Asl matnni yuklash"}
            </Button>
            <Button
              variant="outline"
              onClick={loadTranslation}
              disabled={!!translation}
              className="gap-2"
            >
              <Languages size={14} />
              {translation ? "Yuklandi" : "Tarjimani yuklash"}
            </Button>
          </div>

          {fullText && (
            <div className="rounded-lg bg-muted/50 p-4 max-h-96 overflow-y-auto">
              <h4 className="text-sm font-medium mb-2">Asl matn</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {fullText}
              </p>
            </div>
          )}

          {translation && (
            <div className="rounded-lg bg-muted/50 p-4 max-h-96 overflow-y-auto">
              <h4 className="text-sm font-medium mb-2">O'zbekcha tarjima</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {renderTranslatedText(translation, images, bookId)}
              </div>
            </div>
          )}

          {!fullText && !translation && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Matnni ko'rish uchun yuqoridagi tugmalarni bosing
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
