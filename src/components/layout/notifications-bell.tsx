"use client";

import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadCount } from "@/lib/use-unread-count";

/**
 * Navigatsiyadagi bildirishnomalar belgisi. O'qilmagan xabar bo'lsa
 * qizil nuqta (9+ da "9+") ko'rsatadi.
 */
export function NotificationsBell({
  size = 18,
  className,
  withBadge = true,
}: {
  size?: number;
  className?: string;
  withBadge?: boolean;
}) {
  const unread = useUnreadCount();
  const show = withBadge && typeof unread === "number" && unread > 0;

  return (
    <span className="relative inline-flex shrink-0 items-center justify-center">
      <Bell size={size} className={className} />
      {show && (
        <span
          className={cn(
            "absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white",
            unread && unread > 99 && "hidden"
          )}
          aria-hidden="true"
        >
          {unread && unread > 9 ? "9+" : unread}
        </span>
      )}
    </span>
  );
}