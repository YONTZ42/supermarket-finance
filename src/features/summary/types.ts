import type { Half, StoreCode, SummaryRecord } from "@/src/types/domain";

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
