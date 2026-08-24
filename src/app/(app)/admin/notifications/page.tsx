export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { Bell, Plus, Send, Users, User, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  title: string;
  message: string;
  target: string;
  sentAt: string;
  sentBy: string;
};

export default async function NotificationsPage() {
  const totalUsers = await prisma.user.count();

  const notifications: Notification[] = [
    {
      id: "1",
      title: "Kitobxonlik haftaligi boshlandi!",
      message: "Hurmatli o'quvchilar, kitobxonlik haftaligi boshlandi. Faol bo'ling!",
      target: "Barcha foydalanuvchilar",
      sentAt: "2026-08-24 09:00",
      sentBy: "Admin",
    },
    {
      id: "2",
      title: "Yangi kitob qo'shildi",
      message: "Atomic Habits kitobi kutubxonaga qo'shildi. O'qishni boshlang!",
      target: "Barcha o'quvchilar",
      sentAt: "2026-08-23 14:30",
      sentBy: "Admin",
    },
    {
      id: "3",
      title: "Reyting yangilandi",
      message: "Oylik reyting yangilandi. O'zingizni toping!",
      target: "Barcha foydalanuvchilar",
      sentAt: "2026-08-22 10:00",
      sentBy: "Admin",
    },
    {
      id: "4",
      title: "Topshiriq muddati yaqinlashmoqda",
      message: "3-sinf A guruhi uchun topshiriq muddati 2 kun qoldi.",
      target: "3-sinf A guruhi",
      sentAt: "2026-08-21 16:00",
      sentBy: "Admin",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bildirishnomalar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Foydalanuvchilarga xabar yuboring
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus size={16} />
          Yangi xabar
        </Button>
      </div>

      {/* Send Form */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Send size={18} className="text-primary" />
          Xabar yuborish
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Sarlavha</label>
            <input
              type="text"
              placeholder="Xabar sarlavhasi..."
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Xabar matni</label>
            <textarea
              placeholder="Xabar matnini yozing..."
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Kimga</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { label: "Barcha foydalanuvchilar", icon: <Users size={14} /> },
                { label: "Faqat o'quvchilar", icon: <User size={14} /> },
                { label: "Faqat o'qituvchilar", icon: <User size={14} /> },
                { label: "Guruh bo'yicha", icon: <BookOpen size={14} /> },
              ].map((t) => (
                <button
                  key={t.label}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <Button className="gap-2">
            <Send size={14} />
            Xabar yuborish
          </Button>
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Yuborilgan xabarlar</h2>
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                    <Bell size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{n.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground">
                        📤 {n.target}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        👤 {n.sentBy}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">{n.sentAt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
