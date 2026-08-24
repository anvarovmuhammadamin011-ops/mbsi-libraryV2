"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";

export function AdminCategories({
  categories,
}: {
  categories: { id: string; name: string; bookCount: number }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.post("/api/admin/categories", { name });
      toast.success("Kategoriya qo'shildi");
      setName("");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function remove(id: string) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/api/admin/categories/${id}`);
      toast.success("O'chirildi");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Kategoriyalar</h1>
      <Card className="p-4">
        <form onSubmit={add} className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kategoriya nomi" />
          <Button type="submit" className="gap-2">
            <Plus className="size-4" /> Qo'shish
          </Button>
        </form>
      </Card>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Card key={c.id} className="flex items-center justify-between p-4">
            <span className="font-medium">{c.name}</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{c.bookCount} kitob</span>
              <Button variant="outline" size="icon" onClick={() => remove(c.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
