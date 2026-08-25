"use client";

import { useState } from "react";
import {
  Bell,
  BookOpen,
  Target,
  Coins,
  Trophy,
  CheckCircle,
  Settings,
  Trash2,
} from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "mission" | "book" | "coin" | "rank" | "system" | "achievement";
  read: boolean;
  time: string;
};

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Yangi missiya",
    message: "Sizga yangi kitob topshirig'i berildi: Haftalik 100 sahifa challenge",
    type: "mission",
    read: false,
    time: "2 soat oldin",
  },
  {
    id: "2",
    title: "Coin olindi",
    message: "Tabriklaymiz! Siz 50 Coin oldingiz — missiya bajarildi",
    type: "coin",
    read: false,
    time: "5 soat oldin",
  },
  {
    id: "3",
    title: "Yangi kitob",
    message: "Kutubxonaga yangi kitob qo'shildi: Atomic Habits",
    type: "book",
    read: false,
    time: "Kecha",
  },
  {
    id: "4",
    title: "Reyting yangilandi",
    message: "Siz hozir #17 o'rindasiz. Davom eting!",
    type: "rank",
    read: true,
    time: "Kecha",
  },
  {
    id: "5",
    title: "Ketma-ketlik xabardorligi",
    message: "Bugungi ketma-ketlikni saqlab qolish uchun kamida 1 sahifa o'qing",
    type: "system",
    read: true,
    time: "2 kun oldin",
  },
  {
    id: "6",
    title: "Yutuq olindi",
    message: '"Birinchi kitob" yutuqini oldingiz!',
    type: "achievement",
    read: true,
    time: "3 kun oldin",
  },
];

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
  coin: {
    icon: <Coins size={16} />,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
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
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function clearAll() {
    setNotifications([]);
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            🔔 Bildirishnomalar
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
              onClick={markAllRead}
              className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              Barchasini o'qilgan qilish
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "all"
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Barchasi ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "unread"
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          O'qilmagan ({unreadCount})
        </button>
      </div>

      {/* Notifications list */}
      {filtered.length > 0 ? (
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
                    <h3 className="text-sm font-semibold text-foreground">
                      {n.title}
                    </h3>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
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
          <h3 className="text-sm font-semibold text-foreground">
            {filter === "unread"
              ? "O'qilmagan xabar yo'q"
              : "Bildirishnomalar yo'q"}
          </h3>
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
