import type { DbClient } from "@/src/server/db/prisma";

export type CreateAuditLogInput = {
  targetType: string;
  targetId: string;
  storeId?: string;
  fiscalYear?: number;
  categoryId?: string;
  reportMonth?: number;
  action: string;
  beforeValue?: unknown;
  afterValue?: unknown;
  reason?: string;
};

export async function createAuditLog(db: DbClient, input: CreateAuditLogInput) {
  return db.auditLog.create({
    data: {
      targetType: input.targetType,
      targetId: input.targetId,
      storeId: input.storeId,
      fiscalYear: input.fiscalYear,
      categoryId: input.categoryId,
      reportMonth: input.reportMonth,
      action: input.action,
      beforeValue: input.beforeValue as any,
      afterValue: input.afterValue as any,
      reason: input.reason,
    },
  });
}

export async function listAuditLogs(
  db: DbClient,
  filter: { storeId?: string; fiscalYear?: number; targetType?: string },
) {
  return db.auditLog.findMany({
    where: {
      ...(filter.storeId && { storeId: filter.storeId }),
      ...(filter.fiscalYear && { fiscalYear: filter.fiscalYear }),
      ...(filter.targetType && { targetType: filter.targetType }),
    },
    orderBy: { createdAt: "desc" },
  });
}
