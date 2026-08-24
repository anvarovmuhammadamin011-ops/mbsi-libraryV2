"use client";

import { useEffect } from "react";

/**
 * Initializes Telegram WebApp SDK when running inside Telegram.
 * Safe to use on non-Telegram browsers — it just does nothing.
 */
export function TelegramWebAppProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const win = window as any;
    const tg = win.Telegram?.WebApp;

    if (tg) {
      // Expand to full height
      tg.expand();
      tg.ready();

      // Set theme colors from CSS variables
      const style = getComputedStyle(document.documentElement);
      const bg = style.getPropertyValue("--background").trim() || "#f8fafc";
      const fg = style.getPropertyValue("--foreground").trim() || "#0f172a";

      tg.setHeaderColor(bg);
      tg.setBackgroundColor(bg);

      // Enable closing confirmation
      tg.enableClosingConfirmation();

      // Add class for Telegram-specific CSS
      document.documentElement.classList.add("telegram-webapp");
    }
  }, []);

  return <>{children}</>;
}
