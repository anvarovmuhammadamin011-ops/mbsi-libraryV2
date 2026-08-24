"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat } from "@/components/ui/stat";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  UserCheck,
  Shield,
  Loader2,
  Trash2,
  BookOpen,
  Clock,
  Trophy,
  UserX,
} from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
  bookCount: number;
  sessionCount: number;
  totalPages: number;
  readingTime: number;
  createdAt: string;
}

interface Props {
  users: UserRow[];
  currentUserId: string;
  stats: { total: number; students: number; teachers: number; admins: number };
}

export function AdminUsersTable({ users, currentUserId, stats }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...users];
    if (q) {
      const lower = q.toLowerCase();
      result = result.filter((u) => u.name.toLowerCase().includes(lower));
    }
    if (role !== "all") result = result.filter((u) => u.role === role);
    if (status === "active") result = result.filter((u) => u.isActive);
    if (status === "inactive") result = result.filter((u) => !u.isActive);
    return result;
  }, [users, q, role, status]);

  async function toggleRole(id: string, current: string) {
    setBusy(id);
    try {
      const next = current === "TEACHER" ? "STUDENT" : "TEACHER";
      await api.patch(`/api/admin/users/${id}`, { role: next });
      toast.success(`User role updated to ${next}`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to update role");
    } finally {
      setBusy(null);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    setBusy(id);
    try {
      await api.patch(`/api/admin/users/${id}`, { isActive: !current });
      toast.success(current ? "User deactivated" : "User activated");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage MBSI Library users
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total" value={stats.total.toLocaleString()} icon={<Users className="size-5" />} />
        <Stat label="Students" value={stats.students.toLocaleString()} icon={<UserCheck className="size-5" />} />
        <Stat label="Teachers" value={stats.teachers.toLocaleString()} icon={<Users className="size-5" />} />
        <Stat label="Admins" value={stats.admins.toLocaleString()} icon={<Shield className="size-5" />} />
      </div>

      {/* Search + Filters */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search users..."
              className="pl-9 h-10"
            />
          </div>
          <Select value={role} onValueChange={(v) => setRole(v ?? "all")}>
            <SelectTrigger className="w-36 h-10"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="STUDENT">Student</SelectItem>
              <SelectItem value="TEACHER">Teacher</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
            <SelectTrigger className="w-36 h-10"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="size-8" />}
          title="No users found"
          description="No users match your search criteria."
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground hidden sm:table-cell">Pages</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground hidden md:table-cell">Time</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground hidden lg:table-cell">Books</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {u.name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-[200px]">{u.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={u.role === "ADMIN" ? "default" : "secondary"}
                        className={`text-[10px] ${
                          u.role === "ADMIN"
                            ? "bg-primary/10 text-primary"
                            : u.role === "TEACHER"
                              ? "bg-blue-500/10 text-blue-600"
                              : ""
                        }`}
                      >
                        {u.role === "TEACHER" ? "Teacher" : u.role === "ADMIN" ? "Admin" : "Student"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden sm:table-cell">
                      {u.totalPages.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden md:table-cell">
                      {Math.round(u.readingTime / 60)}h
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden lg:table-cell">
                      {u.bookCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={u.isActive ? "secondary" : "destructive"}
                        className={`text-[10px] ${
                          u.isActive ? "bg-green-500/10 text-green-600" : ""
                        }`}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {u.id !== currentUserId && u.role !== "ADMIN" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={busy === u.id}
                              onClick={() => toggleRole(u.id, u.role)}
                            >
                              {busy === u.id ? <Loader2 className="size-3 animate-spin" /> : null}
                              {u.role === "TEACHER" ? "Make Student" : "Make Teacher"}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              disabled={busy === u.id}
                              onClick={() => toggleActive(u.id, u.isActive)}
                            >
                              {u.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
