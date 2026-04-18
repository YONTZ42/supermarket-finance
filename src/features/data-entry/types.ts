import type { RawRecord, StoreCode, StoreConfig } from "@/src/types/domain";

export type EntryGridValue = {
  categoryCode: string;
  categoryName: string;
  kind: "SALES" | "EXPENSE";
  valuesByPeriod: Record<string, number>;
  isCustom?: boolean;
};

export type EntryFormValues = {
  storeCode: StoreCode;
  fiscalYear: number;
  rows: EntryGridValue[];
};

export type StoreConfigViewModel = StoreConfig & {
  salesCategories: StoreConfig["categories"];
  expenseCategories: StoreConfig["categories"];
  inputModeLabel: string;
};

export type SavePayload = {
  storeCode: StoreCode;
  fiscalYear: number;
  rows: EntryGridValue[];
};

export type SaveResult = {
  savedAt: string;
  records: RawRecord[];
  message: string;
};

export type SaveProgress = {
  current: number;
  total: number;
};
