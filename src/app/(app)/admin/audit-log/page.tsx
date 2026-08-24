import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Edit, Trash2, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogPage() {
  const user = await requireRole("ADMIN");
  if (!user) return null;

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true } },
    },
  });

  const actionIcons: Record<string, { icon: React.ReactNode; color: string }> = {
    CREATE: { icon: <Plus size={14} />, color: "bg-green-500/10 text-green-600" },
    UPDATE: { icon: <Edit size={14} />, color: "bg-blue-500/10 text-blue-600" },
    DELETE: { icon: <Trash2 size={14} />, color: "bg-red-500/10 text-red-600" },
    PUBLISH: { icon: <Shield size={14} />, color: "bg-primary/10 text-primary" },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          System activity history
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <FileText className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No audit logs yet. Activity will appear here as actions are performed.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden lg:table-cell">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => {
                const actionInfo = actionIcons[log.action] ?? { icon: <Shield size={14} />, color: "bg-muted" };
                const meta = log.metadata as Record<string, unknown> | null;
                const detail = meta?.title ?? meta?.name ?? log.entityId;

                return (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{log.user?.name ?? "System"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-md ${actionInfo.color}`}>
                          {actionInfo.icon}
                        </div>
                        <Badge variant="outline" className="text-[10px]">{log.action}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{log.entity}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell truncate max-w-[200px]">
                      {String(detail)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
