import type { SummaryDTO } from "./types";

/** half ごとにグルーピング */
export function groupByHalf(summaries: SummaryDTO[]) {
  const h1 = summaries.filter((s) => s.half === "H1");
  const h2 = summaries.filter((s) => s.half === "H2");
  return { H1: h1, H2: h2 };
}

/** 店舗ごとにグルーピング */
export function groupByStore(summaries: SummaryDTO[]) {
  const map = new Map<string, SummaryDTO[]>();
  for (const s of summaries) {
    let arr = map.get(s.storeCode);
    if (!arr) {
      arr = [];
      map.set(s.storeCode, arr);
    }
    arr.push(s);
  }
  return map;
}

/** 指標ごとの合計を算出 */
export function aggregateTotals(summaries: SummaryDTO[]) {
  let salesTotal = 0;
  let expenseTotal = 0;
  let profit = 0;

  for (const s of summaries) {
    salesTotal += Number(s.salesTotal);
    expenseTotal += Number(s.expenseTotal);
    profit += Number(s.profit);
  }

  const profitRate = salesTotal > 0 ? (profit / salesTotal) * 100 : 0;

  return { salesTotal, expenseTotal, profit, profitRate };
}
