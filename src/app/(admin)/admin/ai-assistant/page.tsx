import { requireRole } from "@/lib/server/auth";
import { AdminAiChat } from "@/components/admin-ai-chat";

export const dynamic = "force-dynamic";

export default async function AiAssistantPage() {
  const admin = await requireRole("ADMIN");
  if (!admin) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">🤖 AI Admin Assistant</h1>
        <p className="text-sm text-muted-foreground mt-1">Tabiiy tilda savol bering — AI faqat mavjud kutubxona ma&apos;lumotlari asosida javob beradi</p>
      </div>
      <AdminAiChat />
    </div>
  );
}
