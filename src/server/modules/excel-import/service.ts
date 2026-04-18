import type { PrismaClient, InputMode, RecordSourceType } from "@prisma/client";
import type { PeriodDefinition } from "@/src/server/modules/store-config/types";
import type { ImportRawRecord, StoreLookup } from "./mapper";
import { parseExcelFile, parseExcelBuffer } from "./parser";
import { mapExcelRowsToRawRecords } from "./mapper";
import { recalculateStoreYear } from "@/src/server/modules/finance/services/recalculate-store-year";

export type ImportResult = {
  imported: number;
  skipped: number;
  skippedDetails: Array<{
    sheetName: string;
    rowLabel: string;
    reportMonth: number;
    reason: string;
  }>;
  recalculated: string[];
};

/**
 * Excel import のオーケストレーション（ファイルパス版）。
 * CLI スクリプトから呼び出す。
 *
 * 1. parser で Excel を読み取る
 * 2. DB から店舗・カテゴリ情報を取得して lookup を構築する
 * 3. mapper でアプリ内部型に変換する
 * 4. raw_records を upsert する
 * 5. 影響する store-year ごとに recalculateStoreYear を実行する
 */
export async function importExcelFile(
  prisma: PrismaClient,
  filePath: string,
  fiscalYear: number,
): Promise<ImportResult> {
  // 1. Parse
  const parsedRows = parseExcelFile(filePath);

  // 2. Build store lookup from DB
  const storeLookup = await buildStoreLookup(prisma);

  // 3. Map
  const fileName = filePath.split(/[/\\]/).pop() ?? filePath;
  const { records, skipped } = mapExcelRowsToRawRecords(
    parsedRows,
    storeLookup,
    fiscalYear,
    fileName,
  );

  // 4. Save raw_records
  for (const record of records) {
    await upsertImportedRecord(prisma, record);
  }

  // 5. Recalculate affected store-years
  const affectedKeys = [
    ...new Set(records.map((r) => `${r.storeCode}-${r.fiscalYear}`)),
  ];

  const recalculated: string[] = [];
  for (const key of affectedKeys) {
    const [storeCode, yearStr] = key.split("-");
    const year = Number(yearStr);
    const store = await prisma.store.findUnique({
      where: { code: storeCode },
    });
    if (store) {
      await recalculateStoreYear(prisma, {
        storeId: store.id,
        fiscalYear: year,
      });
      recalculated.push(key);
    }
  }

  return {
    imported: records.length,
    skipped: skipped.length,
    skippedDetails: skipped,
    recalculated,
  };
}

/**
 * Excel import のオーケストレーション（Buffer版）。
 * API ルートハンドラから呼び出す（一時ファイル不要）。
 */
export async function importExcelBuffer(
  prisma: PrismaClient,
  buffer: Buffer,
  fiscalYear: number,
  sourceFileName: string,
): Promise<ImportResult> {
  // 1. Parse
  const parsedRows = parseExcelBuffer(buffer);

  // 2. Build store lookup from DB
  const storeLookup = await buildStoreLookup(prisma);

  // 3. Map
  const { records, skipped } = mapExcelRowsToRawRecords(
    parsedRows,
    storeLookup,
    fiscalYear,
    sourceFileName,
  );

  // 4. Save raw_records
  for (const record of records) {
    await upsertImportedRecord(prisma, record);
  }

  // 5. Recalculate affected store-years
  const affectedKeys = [
    ...new Set(records.map((r) => `${r.storeCode}-${r.fiscalYear}`)),
  ];

  const recalculated: string[] = [];
  for (const key of affectedKeys) {
    const [storeCode, yearStr] = key.split("-");
    const year = Number(yearStr);
    const store = await prisma.store.findUnique({
      where: { code: storeCode },
    });
    if (store) {
      await recalculateStoreYear(prisma, {
        storeId: store.id,
        fiscalYear: year,
      });
      recalculated.push(key);
    }
  }

  return {
    imported: records.length,
    skipped: skipped.length,
    skippedDetails: skipped,
    recalculated,
  };
}

// ---------- helpers ----------

/** DB の店舗・カテゴリ情報から mapper 用の lookup を構築する */
async function buildStoreLookup(
  prisma: PrismaClient,
): Promise<Map<string, StoreLookup>> {
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    include: {
      reportingProfile: true,
      categories: { where: { isActive: true } },
    },
  });

  const lookup = new Map<string, StoreLookup>();

  for (const store of stores) {
    if (!store.reportingProfile) continue;

    const categoryNameToCode = new Map<string, string>();
    for (const cat of store.categories) {
      categoryNameToCode.set(cat.name, cat.code);
    }

    const entry: StoreLookup = {
      code: store.code,
      inputMode: store.reportingProfile.inputMode as "CUMULATIVE" | "PERIODIC",
      categoryNameToCode,
      periodDefinitions:
        store.reportingProfile.periodDefinitions as PeriodDefinition[],
    };

    // 店舗名（日本語）でも store code（英語）でも引けるようにする
    lookup.set(store.name, entry);
    lookup.set(store.code, entry);
  }

  return lookup;
}

/** 1 件の ImportRawRecord を raw_records に upsert する */
async function upsertImportedRecord(
  prisma: PrismaClient,
  record: ImportRawRecord,
) {
  const store = await prisma.store.findUniqueOrThrow({
    where: { code: record.storeCode },
  });

  const category = await prisma.category.findUniqueOrThrow({
    where: {
      storeId_code: { storeId: store.id, code: record.categoryCode },
    },
  });

  await prisma.rawRecord.upsert({
    where: {
      storeId_fiscalYear_categoryId_reportMonth: {
        storeId: store.id,
        fiscalYear: record.fiscalYear,
        categoryId: category.id,
        reportMonth: record.reportMonth,
      },
    },
    update: {
      periodCode: record.periodCode,
      inputModeSnapshot: record.inputModeSnapshot as InputMode,
      rawAmount: record.rawAmount,
      sourceType: record.sourceType as RecordSourceType,
      sourceFileName: record.sourceFileName,
    },
    create: {
      storeId: store.id,
      fiscalYear: record.fiscalYear,
      categoryId: category.id,
      reportMonth: record.reportMonth,
      periodCode: record.periodCode,
      inputModeSnapshot: record.inputModeSnapshot as InputMode,
      rawAmount: record.rawAmount,
      sourceType: record.sourceType as RecordSourceType,
      sourceFileName: record.sourceFileName,
    },
  });
}
