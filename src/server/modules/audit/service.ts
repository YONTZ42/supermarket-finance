import type { DbClient } from "@/src/server/db/prisma";
import { createAuditLog, type CreateAuditLogInput } from "./repository";

/** raw record の作成を記録 */
export async function logRawRecordCreate(
  db: DbClient,
  params: {
    rawRecordId: string;
    storeId: string;
    fiscalYear: number;
    categoryId: string;
    reportMonth: number;
    afterValue: unknown;
  },
) {
  return createAuditLog(db, {
    targetType: "raw_record",
    targetId: params.rawRecordId,
    storeId: params.storeId,
    fiscalYear: params.fiscalYear,
    categoryId: params.categoryId,
    reportMonth: params.reportMonth,
    action: "CREATE",
    afterValue: params.afterValue,
  });
}

/** raw record の更新を記録 */
export async function logRawRecordUpdate(
  db: DbClient,
  params: {
    rawRecordId: string;
    storeId: string;
    fiscalYear: number;
    categoryId: string;
    reportMonth: number;
    beforeValue: unknown;
    afterValue: unknown;
  },
) {
  return createAuditLog(db, {
    targetType: "raw_record",
    targetId: params.rawRecordId,
    storeId: params.storeId,
    fiscalYear: params.fiscalYear,
    categoryId: params.categoryId,
    reportMonth: params.reportMonth,
    action: "UPDATE",
    beforeValue: params.beforeValue,
    afterValue: params.afterValue,
  });
}

/** 再計算実行を記録 */
export async function logRecalculate(
  db: DbClient,
  params: {
    storeId: string;
    fiscalYear: number;
    afterValue: unknown;
  },
) {
  return createAuditLog(db, {
    targetType: "store_year",
    targetId: `${params.storeId}_${params.fiscalYear}`,
    storeId: params.storeId,
    fiscalYear: params.fiscalYear,
    action: "RECALCULATE",
    afterValue: params.afterValue,
    reason: "recalculate-store-year",
  });
}
