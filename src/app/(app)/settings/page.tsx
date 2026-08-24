"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setAvatar(user.avatar ?? "");
    }
  }, [user]);

  async function save() {
    if (!name.trim()) {
      toast.error("Ism bo'sh bo'lmasligi kerak");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.patch<typeof user>("/api/profile", {
        name,
        avatar,
      });
      setUser(updated as any);
      toast.success("Sozlamalar saqlandi");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sozlamalar</h1>
        <p className="mt-1 text-muted-foreground">Shaxsiy ma'lumotlaringizni tahrirlang</p>
      </div>

      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {avatar && <AvatarImage src={avatar} alt={name} />}
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {name?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{name}</p>
              <p className="text-sm text-muted-foreground">
                {user?.role === "ADMIN"
                  ? "Admin"
                  : user?.role === "TEACHER"
                    ? "O'qituvchi"
                    : "O'quvchi"}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="name">Ism</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="avatar">Avatar (URL)</Label>
            <Input
              id="avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <Button onClick={save} disabled={saving}>
            {saving ? "Saqlanmoqda…" : "Saqlash"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
