import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { logger } from "./log";

// Fire-and-forget audit logging. Failures are logged but never
// break the requesting operation.
export async function logAudit(params: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: {
          ...(params.metadata ?? {}),
          ...(params.ip ? { ip: params.ip } : {}),
        } as Prisma.InputJsonValue,
      },
    });
  } catch (e) {
    logger.error("audit.failed", "Failed to persist audit log", {
      error: e instanceof Error ? e.message : String(e),
      action: params.action,
    });
  }
}
