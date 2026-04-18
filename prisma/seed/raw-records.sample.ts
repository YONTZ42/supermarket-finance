export type SeedRawRecord = {
  storeCode: "TOKYO" | "OSAKA" | "NAGOYA";
  fiscalYear: number;
  categoryCode: string;
  reportMonth: number;
  periodCode: string;
  inputModeSnapshot: "CUMULATIVE" | "PERIODIC";
  rawAmount: string;
  sourceType: "EXCEL_SEED" | "MANUAL_EDIT" | "IMPORT";
  sourceFileName?: string;
};

export const rawRecordSamples: SeedRawRecord[] = [
  {
    storeCode: "TOKYO",
    fiscalYear: 2022,
    categoryCode: "fresh_food",
    reportMonth: 3,
    periodCode: "Q1",
    inputModeSnapshot: "CUMULATIVE",
    rawAmount: "1200000.00",
    sourceType: "EXCEL_SEED",
    sourceFileName: "financial_data.xlsx",
  },
  {
    storeCode: "TOKYO",
    fiscalYear: 2022,
    categoryCode: "fresh_food",
    reportMonth: 6,
    periodCode: "Q2",
    inputModeSnapshot: "CUMULATIVE",
    rawAmount: "2500000.00",
    sourceType: "EXCEL_SEED",
    sourceFileName: "financial_data.xlsx",
  },
  {
    storeCode: "OSAKA",
    fiscalYear: 2022,
    categoryCode: "sweets",
    reportMonth: 3,
    periodCode: "Q1",
    inputModeSnapshot: "PERIODIC",
    rawAmount: "800000.00",
    sourceType: "EXCEL_SEED",
    sourceFileName: "financial_data.xlsx",
  },
];