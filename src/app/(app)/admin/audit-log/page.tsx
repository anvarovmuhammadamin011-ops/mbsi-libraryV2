"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Shield, Plus, Edit, Trash2, ToggleLeft, UserCheck } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEMO_USERS } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

// Demo audit log entries
const DEMO_AUDIT_LOG = [
  {
    id: "log-1",
    userId: "user-8",
    action: "CREATE",
    entity: "Book",
    entityId: "book-1",
    metadata: { title: "Atomic Habits" },
    createdAt: "2025-09-20T14:30:00Z",
  },
  {
    id: "log-2",
    userId: "user-8",
    action: "UPDATE",
    entity: "Book",
    entityId: "book-2",
    metadata: { title: "O'tkan Kunlar" },
    createdAt: "2025-09-19T10:15:00Z",
  },
  {
    id: "log-3",
    userId: "user-8",
    action: "PUBLISH",
    entity: "Book",
    entityId: "book-3",
    metadata: { title: "Fizika 9-sinf" },
    createdAt: "2025-09-18T09:00:00Z",
  },
  {
    id: "log-4",
    userId: "user-8",
    action: "CREATE",
    entity: "Category",
    entityId: "cat-8",
    metadata: { name: "Tarix" },
    createdAt: "2025-09-17T16:45:00Z",
  },
  {
    id: "log-5",
    userId: "user-8",
    action: "UPDATE",
    entity: "User",
    entityId: "user-4",
    metadata: { name: "Nodira Abdullayeva" },
    createdAt: "2025-09-16T11:20:00Z",
  },
  {
    id: "log-6",
    userId: "user-8",
    action: "CREATE",
    entity: "Banner",
    entityId: "banner-1",
    metadata: { title: "Yangi kitoblar" },
    createdAt: "2025-09-15T08:30:00Z",
  },
  {
    id: "log-7",
    userId: "user-8",
    action: "DELETE",
    entity: "Book",
    entityId: "book-old-1",
    metadata: { title: "Eski kitob" },
    createdAt: "2025-09-14T15:00:00Z",
  },
  {
    id: "log-8",
    userId: "user-8",
    action: "ACTIVATE",
    entity: "User",
    entityId: "user-5",
    metadata: { name: "Jasur Toshmatov" },
    createdAt: "2025-09-13T12:00:00Z",
  },
];

const actionIcons: Record<string, React.ReactNode> = {
  CREATE: <Plus size={14} />,
  UPDATE: <Edit size={14} />,
  DELETE: <Trash2 size={14} />,
  PUBLISH: <ToggleLeft size={14} />,
  UNPUBLISH: <ToggleLeft size={14} />,
  ACTIVATE: <UserCheck size={14} />,
};

const actionColors: Record<string, string> = {
  CREATE: "bg-emerald-500/10 text-emerald-500",
  UPDATE: "bg-blue-500/10 text-blue-500",
  DELETE: "bg-red-500/10 text-red-500",
  PUBLISH: "bg-primary/10 text-primary",
  UNPUBLISH: "bg-amber-500/10 text-amber-500",
  ACTIVATE: "bg-violet-500/10 text-violet-500",
};

export default function AuditLogPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== "ADMIN") return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold tracking-tight">📋 Audit Log</h1>
          <p className="mt-1 text-muted-foreground">
            Tizimda amalga oshirilgan barcha muhim harakatlar
          </p>
        </div>

        <div className="space-y-3 animate-slide-up">
          {DEMO_AUDIT_LOG.map((log) => {
            const logUser = DEMO_USERS.find((u) => u.id === log.userId);

            return (
              <Card key={log.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      actionColors[log.action] ?? "bg-muted"
                    )}
                  >
                    {actionIcons[log.action] ?? <Shield size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{logUser?.name}</span>
                      {" "}
                      <span className="text-muted-foreground">
                        {log.action.toLowerCase()} — {log.entity}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.metadata?.title ?? log.metadata?.name ?? log.entityId}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {log.action}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString("uz", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
