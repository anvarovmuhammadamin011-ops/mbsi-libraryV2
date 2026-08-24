"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  bookCount: number;
}

export function AdminCategoriesView({ categories }: { categories: CategoryItem[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [form, setForm] = useState({ name: "", description: "", icon: "" });
  const [busy, setBusy] = useState(false);

  async function addCategory() {
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setBusy(true);
    try {
      await api.post("/api/admin/categories", {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        icon: form.icon.trim() || undefined,
      });
      toast.success("Category created");
      setForm({ name: "", description: "", icon: "" });
      setShowAdd(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to create category");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    try {
      await api.patch(`/api/admin/categories/${editing.id}`, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        icon: form.icon.trim() || undefined,
      });
      toast.success("Category updated");
      setEditing(null);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to update category");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCategory(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will not delete books in this category.`)) return;
    try {
      await api.delete(`/api/admin/categories/${id}`);
      toast.success("Category deleted");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete category");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your library categories · {categories.length} total
          </p>
        </div>
        <Button className="gap-2" onClick={() => { setForm({ name: "", description: "", icon: "" }); setShowAdd(true); }}>
          <Plus size={16} /> Add Category
        </Button>
      </div>

      {/* Grid */}
      {categories.length === 0 ? (
        <EmptyState
          icon={<Tags className="size-8" />}
          title="No categories"
          description="Create your first category to organize books."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div
              key={c.id}
              className="group rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-sm hover:border-primary/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {c.icon && <span className="text-lg">{c.icon}</span>}
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                  </div>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setForm({ name: c.name, description: c.description ?? "", icon: c.icon ?? "" });
                      setEditing(c);
                    }}
                  >
                    <Pencil size={13} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteCategory(c.id, c.name)}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <Badge variant="secondary" className="text-[10px]">
                  {c.bookCount} books
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Fiction" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
            </div>
            <div className="space-y-1.5">
              <Label>Icon (emoji)</Label>
              <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="e.g. 📚" />
            </div>
            <Button onClick={addCategory} disabled={busy} className="w-full">
              {busy ? "Creating..." : "Create Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Icon (emoji)</Label>
              <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </div>
            <Button onClick={saveEdit} disabled={busy} className="w-full">
              {busy ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
