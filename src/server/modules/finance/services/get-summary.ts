import type { DbClient } from "@/src/server/db/prisma";
import type { SummaryFilter, SummaryApiResult } from "../types";
import {
  getSummaryRecords,
  getAvailableFiscalYears,
  getAvailableStores,
} from "../repository";

/**
 * サマリ画面用データを取得する。
 * summary_records を検索し、フロント SummaryApiResponse 型に合わせた shape で返す。
 */
export async function getSummary(
  db: DbClient,
  filter: SummaryFilter,
): Promise<SummaryApiResult> {
  const [rows, availableFiscalYears, availableStores] = await Promise.all([
    getSummaryRecords(db, filter),
    getAvailableFiscalYears(db),
    getAvailableStores(db),
  ]);

  const records = rows.map((r) => ({
    storeCode: r.store.code,
    storeName: r.store.name,
    fiscalYear: r.fiscalYear,
    half: r.half as "H1" | "H2",
    salesTotal: Number(r.salesTotal),
    expenseTotal: Number(r.expenseTotal),
    profit: Number(r.profit),
  }));

  return { records, availableFiscalYears, availableStores };
}
