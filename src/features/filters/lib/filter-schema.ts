import type { SummaryFilter } from "@/src/features/filters/types";

export function createDefaultSummaryFilter(fiscalYear: number): SummaryFilter {
  return {
    fiscalYear,
    storeCode: "ALL",
    half: "ALL",
    metric: "profit",
    compareBy: "store",
    chartType: "bar",
  };
}
