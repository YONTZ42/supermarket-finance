export type StoreCode = "TOKYO" | "OSAKA" | "NAGOYA";
export type CategoryKind = "SALES" | "EXPENSE";
export type InputMode = "CUMULATIVE" | "PERIODIC";
export type Half = "H1" | "H2";
export type SourceType = "EXCEL_SEED" | "MANUAL_EDIT" | "IMPORT";

export type PeriodDefinition = {
  code: string;
  reportMonth: number;
  coveredMonths: number[];
  half: Half;
  displayOrder: number;
};

export type CategoryDefinition = {
  code: string;
  name: string;
  kind: CategoryKind;
  displayOrder: number;
};

export type StoreConfig = {
  code: StoreCode;
  name: string;
  inputMode: InputMode;
  fiscalYearStartMonth: number;
  reportMonths: number[];
  periodDefinitions: PeriodDefinition[];
  categories: CategoryDefinition[];
};

export type RawRecord = {
  storeCode: StoreCode;
  fiscalYear: number;
  categoryCode: string;
  reportMonth: number;
  periodCode: string;
  inputModeSnapshot: InputMode;
  rawAmount: number;
  sourceType: SourceType;
  sourceFileName?: string;
};

export type NormalizedRecord = {
  storeCode: StoreCode;
  storeName: string;
  fiscalYear: number;
  categoryCode: string;
  categoryName: string;
  kind: CategoryKind;
  periodCode: string;
  reportMonth: number;
  half: Half;
  amount: number;
};

export type SummaryRecord = {
  storeCode: StoreCode;
  storeName: string;
  fiscalYear: number;
  half: Half;
  salesTotal: number;
  expenseTotal: number;
  profit: number;
};
