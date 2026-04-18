import type { DbClient } from "@/src/server/db/prisma";
import type { NormalizedInput } from "./types";

// ---------- raw_records ----------

export async function getRawRecords(
  db: DbClient,
  storeId: string,
  fiscalYear: number,
) {
  return db.rawRecord.findMany({
    where: { storeId, fiscalYear },
    orderBy: { reportMonth: "asc" },
  });
}

/** store/category の code を含む raw records を返す（API レスポンス用） */
export async function getRawRecordsWithCodes(
  db: DbClient,
  storeId: string,
  fiscalYear: number,
) {
  return db.rawRecord.findMany({
    where: { storeId, fiscalYear },
    include: {
      store: { select: { code: true } },
      category: { select: { code: true } },
    },
    orderBy: { reportMonth: "asc" },
  });
}

// ---------- normalized_records ----------

export async function deleteNormalizedRecords(
  db: DbClient,
  storeId: string,
  fiscalYear: number,
) {
  return db.normalizedRecord.deleteMany({
    where: { storeId, fiscalYear },
  });
}

export async function createNormalizedRecord(
  db: DbClient,
  input: NormalizedInput,
) {
  return db.normalizedRecord.create({
    data: {
      storeId: input.storeId,
      fiscalYear: input.fiscalYear,
      categoryId: input.categoryId,
      normalizedPeriodCode: input.normalizedPeriodCode,
      half: input.half,
      coveredMonths: input.coveredMonths,
      amount: input.amount,
      rawLinks: {
        create: input.rawRecordIds.map((rawRecordId) => ({ rawRecordId })),
      },
    },
  });
}

export async function createNormalizedRecords(
  db: DbClient,
  inputs: NormalizedInput[],
) {
  for (const input of inputs) {
    await createNormalizedRecord(db, input);
  }
}

// ---------- summary_records ----------

export async function deleteSummaryRecords(
  db: DbClient,
  storeId: string,
  fiscalYear: number,
) {
  return db.summaryRecord.deleteMany({
    where: { storeId, fiscalYear },
  });
}

export async function createSummaryRecord(
  db: DbClient,
  data: {
    storeId: string;
    fiscalYear: number;
    half: "H1" | "H2";
    salesTotal: import("@prisma/client").Prisma.Decimal;
    expenseTotal: import("@prisma/client").Prisma.Decimal;
    profit: import("@prisma/client").Prisma.Decimal;
  },
) {
  return db.summaryRecord.create({ data });
}

export async function getSummaryRecords(
  db: DbClient,
  filter: {
    storeCode?: string;
    fiscalYear?: number;
    half?: "H1" | "H2";
  },
) {
  return db.summaryRecord.findMany({
    where: {
      ...(filter.storeCode && { store: { code: filter.storeCode } }),
      ...(filter.fiscalYear && { fiscalYear: filter.fiscalYear }),
      ...(filter.half && { half: filter.half }),
    },
    include: { store: { select: { code: true, name: true } } },
    orderBy: [{ fiscalYear: "desc" }, { half: "asc" }],
  });
}

// ---------- meta queries ----------

/** summary_records に存在する年度の一覧を返す */
export async function getAvailableFiscalYears(db: DbClient) {
  const rows = await db.summaryRecord.findMany({
    select: { fiscalYear: true },
    distinct: ["fiscalYear"],
    orderBy: { fiscalYear: "desc" },
  });
  return rows.map((r) => r.fiscalYear);
}

/** 全店舗の code/name 一覧を返す */
export async function getAvailableStores(db: DbClient) {
  return db.store.findMany({
    select: { code: true, name: true },
    orderBy: { code: "asc" },
  });
}
