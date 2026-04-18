import type { DbClient } from "@/src/server/db/prisma";
import type { NormalizedApiResult, SummaryFilter } from "../types";
import { getNormalizedRecords } from "../repository";

/**
 * normalized_records を取得し、フロント用の NormalizedDTO 配列として返す。
 * 累積入力（東京・名古屋）の差分計算はすでに recalculate 時に適用済みのため、
 * ここでは格納値をそのまま返す。
 */
export async function getNormalizedSummary(
  db: DbClient,
  filter: SummaryFilter,
): Promise<NormalizedApiResult> {
  const rows = await getNormalizedRecords(db, filter);

  const records = rows.map((r) => ({
    storeCode: r.store.code,
    storeName: r.store.name,
    fiscalYear: r.fiscalYear,
    half: r.half as "H1" | "H2",
    categoryCode: r.category.code,
    categoryName: r.category.name,
    kind: r.category.kind as "SALES" | "EXPENSE",
    periodCode: r.normalizedPeriodCode,
    reportMonth: 0, // normalized records don't have a single reportMonth
    amount: Number(r.amount),
  }));

  return { records };
}
