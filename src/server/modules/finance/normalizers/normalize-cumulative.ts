import type { Prisma } from "@prisma/client";
import type { PeriodDefinition } from "@/src/server/modules/store-config/types";
import type { RawRecordSlice, NormalizedInput } from "@/src/server/modules/finance/types";

/**
 * CUMULATIVE 入力の正規化。
 * 累積値の差分 (current - previous) で期間実績を算出する。
 *
 * 例: 東京 (Q1-Q4)
 *   Q1 = 3月値
 *   Q2 = 6月値 - 3月値
 *   Q3 = 9月値 - 6月値
 *   Q4 = 12月値 - 9月値
 *
 * 例: 名古屋 (H1-H2)
 *   H1 = 6月値
 *   H2 = 12月値 - 6月値
 */
export function normalizeCumulative(
  raws: RawRecordSlice[],
  sortedPDs: PeriodDefinition[],
  storeId: string,
  fiscalYear: number,
): NormalizedInput[] {
  const results: NormalizedInput[] = [];

  const rawByCategory = groupByCategory(raws);

  for (const [categoryId, categoryRaws] of rawByCategory) {
    const sorted = [...categoryRaws].sort(
      (a, b) => a.reportMonth - b.reportMonth,
    );

    for (let i = 0; i < sortedPDs.length; i++) {
      const pd = sortedPDs[i];
      const currentRaw = sorted.find((r) => r.reportMonth === pd.reportMonth);
      if (!currentRaw) continue;

      const rawRecordIds: string[] = [currentRaw.id];
      let amount: Prisma.Decimal;

      if (i === 0) {
        // 最初の報告期間: 累積値がそのまま期間実績
        amount = currentRaw.rawAmount;
      } else {
        const prevPD = sortedPDs[i - 1];
        const prevRaw = sorted.find((r) => r.reportMonth === prevPD.reportMonth);

        if (prevRaw) {
          amount = currentRaw.rawAmount.sub(prevRaw.rawAmount);
          rawRecordIds.push(prevRaw.id);
        } else {
          // 前期データ欠損: 累積値をそのまま使用
          amount = currentRaw.rawAmount;
        }
      }

      results.push({
        storeId,
        fiscalYear,
        categoryId,
        normalizedPeriodCode: pd.code,
        half: pd.half,
        coveredMonths: pd.coveredMonths,
        amount,
        rawRecordIds,
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
