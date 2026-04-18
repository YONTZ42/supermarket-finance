import type { PeriodDefinition } from "@/src/server/modules/store-config/types";
import type { RawRecordSlice, NormalizedInput } from "@/src/server/modules/finance/types";

/**
 * PERIODIC 入力の正規化。
 * rawAmount をそのまま期間実績として扱う（大阪型）。
 */
export function normalizePeriodic(
  raws: RawRecordSlice[],
  sortedPDs: PeriodDefinition[],
  storeId: string,
  fiscalYear: number,
): NormalizedInput[] {
  const results: NormalizedInput[] = [];

  // カテゴリごとにグルーピング
  const rawByCategory = groupByCategory(raws);

  for (const [categoryId, categoryRaws] of rawByCategory) {
    for (const raw of categoryRaws) {
      const pd = sortedPDs.find((p) => p.reportMonth === raw.reportMonth);
      if (!pd) continue;

      results.push({
        storeId,
        fiscalYear,
        categoryId,
        normalizedPeriodCode: pd.code,
        half: pd.half,
        coveredMonths: pd.coveredMonths,
        amount: raw.rawAmount,
        rawRecordIds: [raw.id],
      });
    }
  }

  return results;
}

function groupByCategory(
  raws: RawRecordSlice[],
): Map<string, RawRecordSlice[]> {
  const map = new Map<string, RawRecordSlice[]>();
  for (const raw of raws) {
    let arr = map.get(raw.categoryId);
    if (!arr) {
      arr = [];
      map.set(raw.categoryId, arr);
    }
    arr.push(raw);
  }
  return map;
}
