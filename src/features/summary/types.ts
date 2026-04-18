import type { Half, StoreCode, SummaryRecord } from "@/src/types/domain";
import type { MetricType } from "@/src/features/filters/types";

export type SummaryRow = SummaryRecord & {
  marginRate: number;
};

export type KpiCardData = {
  id: string;
  label: string;
  value: number;
  helper: string;
};

export type SummaryViewModel = {
  rows: SummaryRow[];
  availableFiscalYears: number[];
  availableStores: Array<{ code: StoreCode; name: string }>;
  selectedHalf: Half | "ALL";
};

export type SummaryBreakdownMode =
  | "none"
  | "pl"
  | "salesCategory"
  | "expenseCategory";

export type SummaryMainBarDatum = {
  key: string;
  storeCode: string;
  storeName: string;
  periodKey: string;
  periodLabel: string;
  metric: MetricType | "sales" | "expense" | "profit";
  label: string;
  value: number;
  color: string;
};

export type SummaryMainPeriodGroup = {
  periodKey: string;
  periodLabel: string;
  bars: SummaryMainBarDatum[];
};

export type SummaryMainSelection = {
  storeCode: string;
  periodKey: string;
  metric: string;
  label: string;
};

export type SummaryMainComparisonState = {
  selectedStoreCodes: StoreCode[];
  breakdownMode: SummaryBreakdownMode;
  visiblePeriods: number;
  selection: SummaryMainSelection | null;
};

// ---------- カテゴリ内訳チャート用型 ----------

export type CategorySegment = {
  categoryCode: string;
  categoryName: string;
  amount: number;
  color: string;
};

export type StoreCategoryBar = {
  storeCode: string;
  storeName: string;
  periodKey: string;
  periodLabel: string;
  /** Y スケールの合計値 */
  totalAmount: number;
  /** tooltip の合計ラベル（省略時: "合計"） */
  totalLabel?: string;
  segments: CategorySegment[];
};

export type CategoryPeriodGroup = {
  periodKey: string;
  periodLabel: string;
  stores: StoreCategoryBar[];
};
