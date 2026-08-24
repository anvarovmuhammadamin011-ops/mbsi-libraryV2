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
import { Plus, Pencil, Trash2, Users } from "lucide-react";

interface AuthorItem {
  id: string;
  name: string;
  biography: string | null;
  bookCount: number;
}

export function AdminAuthorsView({ authors }: { authors: AuthorItem[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<AuthorItem | null>(null);
  const [form, setForm] = useState({ name: "", biography: "" });
  const [busy, setBusy] = useState(false);

  async function addAuthor() {
    if (!form.name.trim()) {
      toast.error("Author name is required");
      return;
    }
    setBusy(true);
    try {
      await api.post("/api/admin/authors", {
        name: form.name.trim(),
        biography: form.biography.trim() || undefined,
      });
      toast.success("Author created");
      setForm({ name: "", biography: "" });
      setShowAdd(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to create author");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    try {
      await api.patch(`/api/admin/authors/${editing.id}`, {
        name: form.name.trim(),
        biography: form.biography.trim() || undefined,
      });
      toast.success("Author updated");
      setEditing(null);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to update author");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAuthor(id: string, name: string) {
    if (!confirm(`Delete author "${name}"?`)) return;
    try {
      await api.delete(`/api/admin/authors/${id}`);
      toast.success("Author deleted");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete author");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Authors</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage library authors · {authors.length} total
          </p>
        </div>
        <Button className="gap-2" onClick={() => { setForm({ name: "", biography: "" }); setShowAdd(true); }}>
          <Plus size={16} /> Add Author
        </Button>
      </div>

      {authors.length === 0 ? (
        <EmptyState
          icon={<Users className="size-8" />}
          title="No authors"
          description="Add authors to categorize books."
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Author</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">Biography</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Books</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {authors.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {a.name.charAt(0)}
                      </div>
                      <p className="font-medium text-foreground">{a.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell max-w-[300px] truncate">
                    {a.biography || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant="secondary" className="text-[10px]">{a.bookCount} books</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setForm({ name: a.name, biography: a.biography ?? "" });
                          setEditing(a);
                        }}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteAuthor(a.id, a.name)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Author</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Abdulla Qodiriy" />
            </div>
            <div className="space-y-1.5">
              <Label>Biography</Label>
              <Input value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })} placeholder="Short bio" />
            </div>
            <Button onClick={addAuthor} disabled={busy} className="w-full">
              {busy ? "Creating..." : "Create Author"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Author</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Biography</Label>
              <Input value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })} />
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
