import type { Half, StoreCode } from "@/src/types/domain";

export type CompareBy = "store" | "half";
export type MetricType = "salesTotal" | "expenseTotal" | "profit";
export type ChartType = "bar" | "line" | "stacked";

export type SummaryFilter = {
  fiscalYear: number;
  storeCode: StoreCode | "ALL";
  half: Half | "ALL";
  metric: MetricType;
  compareBy: CompareBy;
  chartType: ChartType;
};
