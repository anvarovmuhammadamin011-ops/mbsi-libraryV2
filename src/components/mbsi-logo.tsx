"use client";

import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface MBSILogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function MBSILogo({ className, showText = true, size = "md" }: MBSILogoProps) {
  const sizes = {
    sm: { icon: 16, container: "h-7 w-7", text: "text-sm" },
    md: { icon: 20, container: "h-8 w-8", text: "text-base" },
    lg: { icon: 28, container: "h-12 w-12", text: "text-xl" },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("flex items-center justify-center rounded-xl bg-primary", s.container)}>
        <BookOpen className="text-white" size={s.icon} />
      </div>
      {showText && (
        <span className={cn("font-bold tracking-tight text-foreground", s.text)}>
          MBSI Library
        </span>
      )}
    </div>
  );
}
