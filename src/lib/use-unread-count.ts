"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";

const POLL_MS = 60_000;

/** O'qilmagan bildirishnomalar soni (navigatsiya belgisi uchun). */
export function useUnreadCount() {
  const [count, setCount] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ items?: unknown[]; unreadCount?: number }>(
        "/api/notifications?limit=1"
      );
      if (typeof data?.unreadCount === "number") setCount(data.unreadCount);
    } catch {
      // Sessiya tugagan yoki tarmoq xatosi — oxirgi qiymat saqlanadi
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(load, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", load);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  return count;
}