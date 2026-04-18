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
  metric: MetricType | "sales" | "expense";
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
