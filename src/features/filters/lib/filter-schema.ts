import type { SummaryFilter } from "@/src/features/filters/types";

export function createDefaultSummaryFilter(fiscalYear: number): SummaryFilter {
  return {
    fiscalYear: "ALL",
    storeCode: "ALL",
    half: "ALL",
    metric: "profit",
    compareBy: "store",
    chartType: "bar",
  };
}
