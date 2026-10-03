"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  BellOff,
  BookOpen,
  Target,
  Trophy,
  CheckCircle,
  Settings,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { usePush } from "@/lib/use-push";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "mission" | "book" | "rank" | "system" | "achievement";
  read: boolean;
  url?: string | null;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "hozir";
  if (m < 60) return `${m} daqiqa oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  if (d === 1) return "kecha";
  if (d < 7) return `${d} kun oldin`;
  return new Date(iso).toLocaleDateString("uz-UZ");
}

const TYPE_CONFIG: Record<
  Notification["type"],
  { icon: React.ReactNode; color: string; bgColor: string }
> = {
  mission: {
    icon: <Target size={16} />,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
  },
  book: {
    icon: <BookOpen size={16} />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  rank: {
    icon: <Trophy size={16} />,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
  system: {
    icon: <Settings size={16} />,
    color: "text-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
  },
  achievement: {
    icon: <CheckCircle size={16} />,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const push = usePush();

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ items: Notification[]; unreadCount: number }>(
        "/api/notifications"
      );
      setNotifications(data.items);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    api.post("/api/notifications", { ids: [id] }).catch(() => {});
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    api.post("/api/notifications", {}).catch(() => {});
  }

  function clearAll() {
    setNotifications([]);
    api.del("/api/notifications").catch(() => {});
  }

  return (
    <div className="space-y-6 animate-fade-in pb-28 md:pb-0 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bell size={20} className="text-primary" />
            Bildirishnomalar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} ta o'qilmagan xabar`
              : "Barcha xabalar o'qilgan"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="min-h-11 rounded-lg bg-primary/10 px-3 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              Barchasini o'qilgan qilish
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              aria-label="Barcha xabarlarni o'chirish"
              className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30 px-3 text-xs font-medium text-red-600 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Push bildirishnomalari */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Bell size={16} className="text-primary" />
              Telefonga xabar yuborish
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {push.state === "unsupported"
                ? "Bu brauzer bildirishnomalarni qo'llab-quvvatlamaydi"
                : push.state === "denied"
                  ? "Ruxsat brauzer sozlamalarida yopilgan"
                  : "Yangi topshiriq, reyting va xabardorliklarni telefoningizga oling"}
            </p>
          </div>
          {push.state !== "unsupported" && push.state !== "denied" && (
            <button
              type="button"
              onClick={() => (push.state === "enabled" ? push.disable() : push.enable())}
              disabled={push.busy}
              className={`shrink-0 min-h-11 inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors disabled:opacity-60 ${
                push.state === "enabled"
                  ? "bg-red-50 dark:bg-red-950/30 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/50"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              {push.state === "enabled" ? (
                <>
                  <BellOff size={14} /> O'chirish
                </>
              ) : (
                "Yoqish"
              )}
            </button>
          )}
        </div>
        {push.message && (
          <p className="text-xs text-muted-foreground mt-2">{push.message}</p>
        )}
      </div>
            {/* Filter tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`min-h-11 rounded-lg px-3 text-xs font-medium transition-colors ${
            filter === "all"
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Barchasi ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`min-h-11 rounded-lg px-3 text-xs font-medium transition-colors ${
            filter === "unread"
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          O'qilmagan ({unreadCount})
        </button>
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-xs text-muted-foreground">Yuklanmoqda…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30 mb-4">
            <BellOff size={24} className="text-red-500" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            Bildirishnomalarni yuklab bo'lmadi
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">{error}</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((n) => {
            const config = TYPE_CONFIG[n.type];
            return (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`flex items-start gap-3 rounded-xl border bg-card p-4 cursor-pointer transition-all ${
                  n.read
                    ? "border-border opacity-70"
                    : "border-primary/20 bg-primary/5"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bgColor} ${config.color}`}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground">
                      {n.title}
                    </h2>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <Bell size={24} className="text-muted-foreground" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            {filter === "unread"
              ? "O'qilmagan xabar yo'q"
              : "Bildirishnomalar yo'q"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            {filter === "unread"
              ? "Barcha xabarlar o'qilgan"
              : "Yangi bildirishnomalar shu yerda paydo bo'ladi"}
          </p>
        </div>
      )}
    </div>
  );
}
