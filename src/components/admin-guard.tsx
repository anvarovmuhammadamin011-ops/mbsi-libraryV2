"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldX, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MBSILogo } from "@/components/mbsi-logo";

/**
 * Client-side admin guard. Used inside admin layout because
 * server-side redirect() / notFound() don't work reliably in
 * Next.js 16 Turbopack route group layouts.
 */
export function AdminGuard({ userRole }: { userRole: string | null }) {
  const router = useRouter();

  // No user or not admin → show forbidden page
  if (userRole !== "ADMIN") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 rounded-full bg-destructive/10 p-6">
          <ShieldX className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="mb-2 text-6xl font-bold tracking-tight">403</h1>
        <h2 className="mb-2 text-xl font-semibold">Ruxsat yo'q</h2>
        <p className="mb-8 max-w-sm text-muted-foreground">
          Sizda admin paneliga kirish huquqi yo'q. Faqat administratorlar kirishi mumkin.
        </p>
        <Button onClick={() => router.push("/home")} className="gap-2">
          <Home size={16} />
          Bosh sahifaga qaytish
        </Button>
      </div>
    );
  }

  return null;
}
