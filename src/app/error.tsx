"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 rounded-full bg-destructive/10 p-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <h1 className="mb-2 text-6xl font-bold tracking-tight">500</h1>
      <h2 className="mb-2 text-xl font-semibold">Xatolik yuz berdi</h2>
      <p className="mb-8 max-w-sm text-muted-foreground">
        Kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko&apos;ring.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
          <ArrowLeft size={16} />
          Orqaga
        </Button>
        <Button onClick={reset} className="gap-2">
          <RefreshCw size={16} />
          Qayta urinish
        </Button>
      </div>
    </div>
  );
}
