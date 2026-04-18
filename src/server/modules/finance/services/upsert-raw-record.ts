import type { PrismaClient } from "@prisma/client";
import type { InputMode, RecordSourceType } from "@prisma/client";
import type { RawRecordInput, BulkUpsertPayload, BulkUpsertResult, RawRecordDTO } from "../types";
import type { PeriodDefinition } from "@/src/server/modules/store-config/types";
import { logRawRecordCreate, logRawRecordUpdate } from "@/src/server/modules/audit/service";
import { recalculateStoreYear } from "./recalculate-store-year";

/**
 * raw record を作成または更新し、再計算を起動する。
 *
 * 1. store の inputMode を取得して snapshot に保存
 * 2. raw_records を upsert
 * 3. audit log 記録
 * 4. recalculateStoreYear で normalized / summary を再生成
 */
export async function upsertRawRecord(
  prisma: PrismaClient,
  input: RawRecordInput,
) {
  const { storeId, fiscalYear, categoryId, reportMonth, periodCode, rawAmount, sourceType } = input;

  // inputMode 取得
  const profile = await prisma.storeReportingProfile.findUniqueOrThrow({
    where: { storeId },
  });

  // 既存レコード確認
  const existing = await prisma.rawRecord.findUnique({
    where: {
      storeId_fiscalYear_categoryId_reportMonth: {
        storeId,
        fiscalYear,
        categoryId,
        reportMonth,
      },
    },
  });

  const record = await prisma.rawRecord.upsert({
    where: {
      storeId_fiscalYear_categoryId_reportMonth: {
        storeId,
        fiscalYear,
        categoryId,
        reportMonth,
      },
    },
    update: {
      periodCode,
      rawAmount,
      sourceType: sourceType as RecordSourceType,
      inputModeSnapshot: profile.inputMode,
    },
    create: {
      storeId,
      fiscalYear,
      categoryId,
      reportMonth,
      periodCode,
      rawAmount,
      sourceType: sourceType as RecordSourceType,
      inputModeSnapshot: profile.inputMode as InputMode,
    },
  });

  // 監査ログ
  if (existing) {
    await logRawRecordUpdate(prisma, {
      rawRecordId: record.id,
      storeId,
      fiscalYear,
      categoryId,
      reportMonth,
      beforeValue: { rawAmount: existing.rawAmount.toString() },
      afterValue: { rawAmount: record.rawAmount.toString() },
    });
  } else {
    await logRawRecordCreate(prisma, {
      rawRecordId: record.id,
      storeId,
      fiscalYear,
      categoryId,
      reportMonth,
      afterValue: { rawAmount: record.rawAmount.toString() },
    });
  }

  // 再計算
  await recalculateStoreYear(prisma, { storeId, fiscalYear });

  return record;
}

/**
 * フロント SavePayload 形式で一括保存する。
 * storeCode / categoryCode → ID 解決 → 各期間の raw record を upsert → 再計算
 */
export async function bulkUpsertRawRecords(
  prisma: PrismaClient,
  payload: BulkUpsertPayload,
): Promise<BulkUpsertResult> {
  const { storeCode, fiscalYear, rows } = payload;

  // store 解決
  const store = await prisma.store.findUniqueOrThrow({
    where: { code: storeCode },
    include: {
      reportingProfile: true,
      categories: { where: { isActive: true } },
    },
  });
  const profile = store.reportingProfile!;
  const periodDefs = profile.periodDefinitions as PeriodDefinition[];
  const categoryByCode = new Map(store.categories.map((c) => [c.code, c]));

  // periodCode → reportMonth マップ
  const periodToMonth = new Map(periodDefs.map((p) => [p.code, p.reportMonth]));

  // 各行の各期間を upsert
  const upsertedRecords: Array<{
    storeCode: string;
    fiscalYear: number;
    categoryCode: string;
    reportMonth: number;
    periodCode: string;
    inputModeSnapshot: string;
    rawAmount: number;
    sourceType: string;
  }> = [];

  for (const row of rows) {
    const category = categoryByCode.get(row.categoryCode);
    if (!category) continue;

    for (const [periodCode, amount] of Object.entries(row.valuesByPeriod)) {
      const reportMonth = periodToMonth.get(periodCode);
      if (reportMonth === undefined) continue;

      const existing = await prisma.rawRecord.findUnique({
        where: {
          storeId_fiscalYear_categoryId_reportMonth: {
            storeId: store.id,
            fiscalYear,
            categoryId: category.id,
            reportMonth,
          },
        },
      });

      const record = await prisma.rawRecord.upsert({
        where: {
          storeId_fiscalYear_categoryId_reportMonth: {
            storeId: store.id,
            fiscalYear,
            categoryId: category.id,
            reportMonth,
          },
        },
        update: {
          periodCode,
          rawAmount: String(amount),
          sourceType: "MANUAL_EDIT" as RecordSourceType,
          inputModeSnapshot: profile.inputMode,
        },
        create: {
          storeId: store.id,
          fiscalYear,
          categoryId: category.id,
          reportMonth,
          periodCode,
          rawAmount: String(amount),
          sourceType: "MANUAL_EDIT" as RecordSourceType,
          inputModeSnapshot: profile.inputMode as InputMode,
        },
      });

      // 監査ログ
      if (existing) {
        await logRawRecordUpdate(prisma, {
          rawRecordId: record.id,
          storeId: store.id,
          fiscalYear,
          categoryId: category.id,
          reportMonth,
          beforeValue: { rawAmount: existing.rawAmount.toString() },
          afterValue: { rawAmount: record.rawAmount.toString() },
        });
      } else {
        await logRawRecordCreate(prisma, {
          rawRecordId: record.id,
          storeId: store.id,
          fiscalYear,
          categoryId: category.id,
          reportMonth,
          afterValue: { rawAmount: record.rawAmount.toString() },
        });
      }

      upsertedRecords.push({
        storeCode: store.code,
        fiscalYear,
        categoryCode: row.categoryCode,
        reportMonth,
        periodCode,
        inputModeSnapshot: profile.inputMode,
        rawAmount: Number(record.rawAmount),
        sourceType: "MANUAL_EDIT",
      });
    }
  }

  // 再計算（1回だけ）
  await recalculateStoreYear(prisma, { storeId: store.id, fiscalYear });

  const savedAt = new Date().toISOString();
  return {
    records: upsertedRecords as RawRecordDTO[],
    savedAt,
    message: `${storeCode} / ${fiscalYear} を ${upsertedRecords.length} 件保存しました`,
  };
}
