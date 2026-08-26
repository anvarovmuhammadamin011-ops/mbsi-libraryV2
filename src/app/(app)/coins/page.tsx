export const dynamic = "force-dynamic";

import { Coins, ShoppingCart, History, TrendingUp, TrendingDown, Gift, Trophy, Flame, BookOpen } from "lucide-react";

type CoinHistory = {
  id: string;
  amount: number;
  type: "earn" | "spend";
  description: string;
  date: string;
};

type MarketItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  category: string;
};

const COIN_HISTORY: CoinHistory[] = [
  { id: "1", amount: 50, type: "earn", description: "Missiya bajarildi", date: "Bugun" },
  { id: "2", amount: 20, type: "earn", description: "Kitob tugatildi", date: "Kecha" },
  { id: "3", amount: 10, type: "earn", description: "Kunlik maqsad bajarildi", date: "Kecha" },
  { id: "4", amount: 100, type: "spend", description: "Do'kondan sotib olindi", date: "2 kun oldin" },
  { id: "5", amount: 30, type: "earn", description: "Missiya bajarildi", date: "3 kun oldin" },
];

const MARKET_ITEMS: MarketItem[] = [
  { id: "1", name: "Premium mavzu", description: "Maxsus dizayn mavzusi", price: 100, icon: "🎨", category: "Theme" },
  { id: "2", name: "Maxsus nishon", description: "Maxsus badge yutuq", price: 150, icon: "🏆", category: "Badge" },
  { id: "3", name: "Ketma-ketlikni muzlatish", description: "1 kunlik ketma-ketlik himoyasi", price: 100, icon: "🔥", category: "Power-up" },
  { id: "4", name: "O'qish bonusi", description: "2x coin 3 kun", price: 200, icon: "🎟️", category: "Power-up" },
  { id: "5", name: "Avatar ramkasi", description: "Maxsus avatar ramka", price: 120, icon: "🖼️", category: "Avatar" },
  { id: "6", name: "Shaxsiy status", description: "Shaxsiy status matn", price: 80, icon: "✨", category: "Profile" },
];

import { getSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";

export default async function CoinsPage() {
  const sessionUser = await getSessionUser();
  const dbUser = sessionUser
    ? await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { coins: true } })
    : null;
  const totalCoins = (dbUser as any)?.coins ?? 450;

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto">
      {/* Coin Balance */}
      <div className="rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <Coins size={24} />
          </div>
          <div>
            <p className="text-sm opacity-80">Mening coinlarim</p>
            <p className="text-3xl font-bold">{totalCoins}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-white/10 p-3 text-center">
            <TrendingUp size={16} className="mx-auto mb-1 opacity-80" />
            <p className="text-xs opacity-80">Bugun</p>
            <p className="text-sm font-bold">+50</p>
          </div>
          <div className="flex-1 rounded-xl bg-white/10 p-3 text-center">
            <History size={16} className="mx-auto mb-1 opacity-80" />
            <p className="text-xs opacity-80">Jami</p>
            <p className="text-sm font-bold">+890</p>
          </div>
          <div className="flex-1 rounded-xl bg-white/10 p-3 text-center">
            <ShoppingCart size={16} className="mx-auto mb-1 opacity-80" />
            <p className="text-xs opacity-80">Sarflangan</p>
            <p className="text-sm font-bold">-440</p>
          </div>
        </div>
      </div>

      {/* Market */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">🛒 Coin do&apos;koni</h2>
          <span className="text-xs text-muted-foreground">{MARKET_ITEMS.length} mahsulot</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {MARKET_ITEMS.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-4">
              <div className="text-2xl mb-2">{item.icon}</div>
              <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="flex items-center gap-1 text-xs font-bold text-yellow-600">
                  <Coins size={12} /> {item.price}
                </span>
                <button
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                    totalCoins >= item.price
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                  disabled={totalCoins < item.price}
                >
                  Sotib olish
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coin History */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">📋 Coin tarixi</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {COIN_HISTORY.map((h, i) => (
            <div
              key={h.id}
              className={`flex items-center gap-3 p-4 ${
                i < COIN_HISTORY.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                h.type === "earn"
                  ? "bg-green-50 dark:bg-green-950/30 text-green-600"
                  : "bg-red-50 dark:bg-red-950/30 text-red-500"
              }`}>
                {h.type === "earn" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{h.description}</p>
                <p className="text-xs text-muted-foreground">{h.date}</p>
              </div>
              <span className={`text-sm font-bold ${
                h.type === "earn" ? "text-green-600" : "text-red-500"
              }`}>
                {h.type === "earn" ? "+" : "-"}{h.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
