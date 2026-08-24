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
    sm: { icon: 18, text: "text-sm" },
    md: { icon: 24, text: "text-lg" },
    lg: { icon: 32, text: "text-2xl" },
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center justify-center rounded-xl bg-primary p-2">
        <BookOpen className="text-primary-foreground" size={sizes[size].icon} />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-bold tracking-tight", sizes[size].text)}>
            MBSI Library
          </span>
        </div>
      )}
    </div>
  );
}
