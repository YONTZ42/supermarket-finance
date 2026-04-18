/** periodDefinitions JSON の 1 要素を表す型 (SSOT: prisma/schema.prisma) */
export type PeriodDefinition = {
  code: string;
  reportMonth: number;
  coveredMonths: number[];
  half: "H1" | "H2";
  displayOrder: number;
};

/** seed 投入用の店舗プロファイル定義 */
export type SeedStoreProfile = {
  store: {
    code: string;
    name: string;
  };
  reportingProfile: {
    inputMode: "CUMULATIVE" | "PERIODIC";
    fiscalYearStartMonth: number;
    reportMonths: number[];
    periodDefinitions: PeriodDefinition[];
  };
  categories: Array<{
    code: string;
    name: string;
    kind: "SALES" | "EXPENSE";
    displayOrder: number;
  }>;
};
