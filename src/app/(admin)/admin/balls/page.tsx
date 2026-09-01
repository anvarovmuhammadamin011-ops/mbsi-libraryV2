"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  Star,
  TrendingUp,
  TrendingDown,
  Search,
  Award,
  AlertTriangle,
} from "lucide-react";

interface UserBall {
  id: string;
  name: string;
  role: string;
  balls: number;
}

interface BallHistory {
  id: string;
  amount: number;
  balance: number;
  type: string;
  description: string | null;
  createdAt: string;
}

export default function AdminBallsPage() {
  const [users, setUsers] = useState<UserBall[]>([]);
  const [maxBalls, setMaxBalls] = useState(12);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserBall | null>(null);
  const [history, setHistory] = useState<BallHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState<"give" | "take" | "set">("give");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [penaltyLoading, setPenaltyLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/balls");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
        setMaxBalls(data.data.maxBalls);
      }
    } catch (e) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(userId: string) {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/admin/balls?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.data.history);
      }
    } catch (e) {
      toast.error("Tarixni yuklashda xatolik");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleAction() {
    if (!selectedUser || !amount) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/balls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: actionType,
          amount: parseFloat(amount),
          description: description || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Ball ${actionType === "give" ? "berildi" : actionType === "take" ? "olindi" : "o'zgartirildi"}`);
        setActionOpen(false);
        setAmount("");
        setDescription("");
        loadUsers();
        if (selectedUser) {
          loadHistory(selectedUser.id);
        }
      } else {
        throw new Error(data.error?.message || "Xatolik");
      }
    } catch (e: any) {
      toast.error(e.message || "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  async function runPenaltyCheck() {
    setPenaltyLoading(true);
    try {
      const res = await fetch("/api/admin/balls/penalty-check", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.data.message);
        loadUsers();
      }
    } catch (e) {
      toast.error("Penalty check xatolik");
    } finally {
      setPenaltyLoading(false);
    }
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const typeLabels: Record<string, string> = {
    BOOK_READ: "Kitob",
    MISSION_COMPLETE: "Missiya",
    MISSION_PENALTY: "Jazo",
    ADMIN_GIVE: "Admin",
    ADMIN_TAKE: "Admin",
    MANUAL: "Qo'lda",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ball boshqaruvi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Foydalanuvchilarga ball berish/olish · Maksimum: {maxBalls}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={runPenaltyCheck}
          disabled={penaltyLoading}
        >
          {penaltyLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <AlertTriangle size={16} />
          )}
          Jazo tekshirish
        </Button>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Foydalanuvchi qidirish..."
            className="pl-9 h-10"
          />
        </div>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Foydalanuvchi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                    Ballar
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                    Holat
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedUser(user);
                      loadHistory(user.id);
                    }}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{user.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-[10px]">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-yellow-600">
                        {user.balls.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                            style={{
                              width: `${Math.min((user.balls / maxBalls) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {Math.round((user.balls / maxBalls) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-green-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                            setActionType("give");
                            setActionOpen(true);
                          }}
                        >
                          <TrendingUp size={12} />
                          Berish
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                            setActionType("take");
                            setActionOpen(true);
                          }}
                        >
                          <TrendingDown size={12} />
                          Olish
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action dialog */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "give" ? (
                <TrendingUp size={18} className="text-green-500" />
              ) : (
                <TrendingDown size={18} className="text-red-500" />
              )}
              Ball {actionType === "give" ? "berish" : "olish"}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <strong>{selectedUser.name}</strong> uchun
              </p>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Miqdor</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={actionType === "take" ? selectedUser.balls : maxBalls}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.5"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Izoh (ixtiyoriy)</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Sabab..."
                />
              </div>
              <Button
                className="w-full"
                onClick={handleAction}
                disabled={saving || !amount}
              >
                {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Tasdiqlash
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog
        open={selectedUser !== null && !actionOpen}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star size={18} className="fill-yellow-500 text-yellow-500" />
              {selectedUser?.name} — Ball tarixi
            </DialogTitle>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {selectedUser && (
                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">Joriy ball</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {selectedUser.balls.toFixed(1)} / {maxBalls}
                  </span>
                </div>
              )}
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tarix topilmadi
                </p>
              ) : (
                <div className="space-y-1">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {h.amount > 0 ? (
                          <TrendingUp size={12} className="text-green-500" />
                        ) : (
                          <TrendingDown size={12} className="text-red-500" />
                        )}
                        <div>
                          <p className="text-xs">
                            {h.description || typeLabels[h.type]}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(h.createdAt).toLocaleDateString("uz")}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium ${h.amount > 0 ? "text-green-500" : "text-red-500"}`}
                      >
                        {h.amount > 0 ? "+" : ""}
                        {h.amount.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
