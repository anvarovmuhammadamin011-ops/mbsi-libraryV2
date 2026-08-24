"use client";

import Link from "next/link";
import { BookX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 rounded-full bg-muted p-6">
        <BookX className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="mb-2 text-6xl font-bold tracking-tight">404</h1>
      <h2 className="mb-2 text-xl font-semibold">Sahifa topilmadi</h2>
      <p className="mb-8 max-w-sm text-muted-foreground">
        Siz qidirgan sahifa mavjud emas yoki ko'chirilgan.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
          <ArrowLeft size={16} />
          Orqaga
        </Button>
        <Link href="/">
          <Button>Bosh sahifa</Button>
        </Link>
      </div>
    </div>
  );
}
