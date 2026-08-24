import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// Fire-and-forget audit logging. Failures are logged but never
// break the requesting operation.
export async function logAudit(params: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: (params.metadata ?? null) as Prisma.InputJsonValue,
      },
    });
  } catch (e) {
    console.error("[AUDIT_LOG_FAILED]", e);
  }
}
