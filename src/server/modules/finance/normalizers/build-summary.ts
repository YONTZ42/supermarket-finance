import { Prisma } from "@prisma/client";
import type { NormalizedInput, HalfTotals } from "@/src/server/modules/finance/types";

/**
 * normalized_records から半期ごとのサマリを構築する。
 *
 * H1/H2 それぞれについて:
 *   salesTotal  = SALES カテゴリの amount 合計
 *   expenseTotal = EXPENSE カテゴリの amount 合計
 *   profit = salesTotal - expenseTotal
 */
export function buildHalfSummaries(
  normalizedInputs: NormalizedInput[],
  categoryKindMap: Map<string, string>,
): Map<"H1" | "H2", HalfTotals> {
  const result = new Map<"H1" | "H2", HalfTotals>();

  for (const n of normalizedInputs) {
    let entry = result.get(n.half);
    if (!entry) {
      entry = {
        salesTotal: new Prisma.Decimal(0),
        expenseTotal: new Prisma.Decimal(0),
      };
      result.set(n.half, entry);
    }

    const kind = categoryKindMap.get(n.categoryId);
    if (kind === "SALES") {
      entry.salesTotal = entry.salesTotal.add(n.amount);
    } else if (kind === "EXPENSE") {
      entry.expenseTotal = entry.expenseTotal.add(n.amount);
    }
  }

  return result;
}
