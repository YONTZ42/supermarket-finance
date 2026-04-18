import { rawRecordSamples } from "@/prisma/seed/raw-records.sample";
import { storeProfiles } from "@/prisma/seed/master-data";
import type {
  CategoryDefinition,
  Half,
  NormalizedRecord,
  RawRecord,
  StoreCode,
  StoreConfig,
  SummaryRecord,
} from "@/src/types/domain";

type FinanceSnapshot = {
  stores: StoreConfig[];
  rawRecords: RawRecord[];
  normalizedRecords: NormalizedRecord[];
  summaryRecords: SummaryRecord[];
  fiscalYears: number[];
};

const fiscalYears = [2022, 2023, 2024];

const storeNameMap: Record<StoreCode, string> = {
  TOKYO: "東京",
  OSAKA: "大阪",
  NAGOYA: "名古屋",
};

function buildStores(): StoreConfig[] {
  return storeProfiles.map((profile) => ({
    code: profile.store.code as StoreCode,
    name: profile.store.name,
    inputMode: profile.reportingProfile.inputMode,
    fiscalYearStartMonth: profile.reportingProfile.fiscalYearStartMonth,
    reportMonths: profile.reportingProfile.reportMonths,
    periodDefinitions: [...profile.reportingProfile.periodDefinitions].sort(
      (left, right) => left.displayOrder - right.displayOrder,
    ),
    categories: [...profile.categories].sort(
      (left, right) => left.displayOrder - right.displayOrder,
    ),
  }));
}

function buildSampleMap() {
  return new Map(
    rawRecordSamples.map((sample) => [
      `${sample.storeCode}-${sample.fiscalYear}-${sample.categoryCode}-${sample.periodCode}`,
      Number(sample.rawAmount),
    ]),
  );
}

function getStoreMultiplier(storeCode: StoreCode) {
  switch (storeCode) {
    case "TOKYO":
      return 1.16;
    case "OSAKA":
      return 0.96;
    case "NAGOYA":
      return 1.04;
  }
}

function getCategoryBaseAmount(category: CategoryDefinition, yearOffset: number) {
  const salesBase = 680_000 + yearOffset * 120_000 + category.displayOrder * 56_000;
  const expenseBase =
    240_000 + yearOffset * 42_000 + (category.displayOrder - 100) * 31_000;

  return category.kind === "SALES" ? salesBase : expenseBase;
}

function getPeriodScale(index: number, count: number) {
  if (count === 2) {
    return [1.04, 1.22][index] ?? 1;
  }

  return [0.92, 1.02, 1.08, 1.18][index] ?? 1;
}

function buildRawRecords(stores: StoreConfig[]) {
  const sampleMap = buildSampleMap();
  const records: RawRecord[] = [];

  for (const store of stores) {
    const storeMultiplier = getStoreMultiplier(store.code);

    for (const fiscalYear of fiscalYears) {
      const yearOffset = fiscalYear - fiscalYears[0];

      for (const category of store.categories) {
        const periodAmounts = store.periodDefinitions.map((period, index) => {
          const base = getCategoryBaseAmount(category, yearOffset);
          const scaled = base * getPeriodScale(index, store.periodDefinitions.length);
          return Math.round(scaled * storeMultiplier);
        });

        let cumulativeTotal = 0;

        store.periodDefinitions.forEach((period, index) => {
          const key = `${store.code}-${fiscalYear}-${category.code}-${period.code}`;
          const sampleAmount = sampleMap.get(key);
          const generatedPeriodic = periodAmounts[index];

          let rawAmount: number;

          if (store.inputMode === "CUMULATIVE") {
            rawAmount =
              sampleAmount ??
              (cumulativeTotal + generatedPeriodic + Math.round(index * 18_000 * storeMultiplier));
            cumulativeTotal = rawAmount;
          } else {
            rawAmount = sampleAmount ?? generatedPeriodic;
          }

          records.push({
            storeCode: store.code,
            fiscalYear,
            categoryCode: category.code,
            reportMonth: period.reportMonth,
            periodCode: period.code,
            inputModeSnapshot: store.inputMode,
            rawAmount,
            sourceType: sampleAmount ? "EXCEL_SEED" : "MANUAL_EDIT",
            sourceFileName: sampleAmount ? "financial_data.xlsx" : undefined,
          });
        });
      }
    }
  }

  return records;
}

function buildNormalizedRecords(stores: StoreConfig[], rawRecords: RawRecord[]) {
  const storeMap = new Map(stores.map((store) => [store.code, store]));
  const normalized: NormalizedRecord[] = [];

  for (const store of stores) {
    const storeRecords = rawRecords.filter((record) => record.storeCode === store.code);
    const categoryMap = new Map(store.categories.map((category) => [category.code, category]));

    for (const fiscalYear of fiscalYears) {
      const yearRecords = storeRecords.filter((record) => record.fiscalYear === fiscalYear);

      for (const category of store.categories) {
        const categoryRecords = yearRecords
          .filter((record) => record.categoryCode === category.code)
          .sort((left, right) => left.reportMonth - right.reportMonth);

        let previousCumulative = 0;

        categoryRecords.forEach((record) => {
          const categoryDefinition = categoryMap.get(record.categoryCode);
          const periodDefinition = storeMap
            .get(store.code)
            ?.periodDefinitions.find((period) => period.code === record.periodCode);

          if (!categoryDefinition || !periodDefinition) {
            return;
          }

          const amount =
            record.inputModeSnapshot === "CUMULATIVE"
              ? record.rawAmount - previousCumulative
              : record.rawAmount;

          previousCumulative =
            record.inputModeSnapshot === "CUMULATIVE" ? record.rawAmount : previousCumulative;

          normalized.push({
            storeCode: record.storeCode,
            fiscalYear: record.fiscalYear,
            categoryCode: record.categoryCode,
            categoryName: categoryDefinition.name,
            kind: categoryDefinition.kind,
            periodCode: record.periodCode,
            reportMonth: record.reportMonth,
            half: periodDefinition.half,
            amount,
          });
        });
      }
    }
  }

  return normalized;
}

function buildSummaryRecords(normalizedRecords: NormalizedRecord[]) {
  const summaryMap = new Map<string, SummaryRecord>();

  for (const record of normalizedRecords) {
    const key = `${record.storeCode}-${record.fiscalYear}-${record.half}`;
    const current =
      summaryMap.get(key) ??
      {
        storeCode: record.storeCode,
        storeName: storeNameMap[record.storeCode],
        fiscalYear: record.fiscalYear,
        half: record.half,
        salesTotal: 0,
        expenseTotal: 0,
        profit: 0,
      };

    if (record.kind === "SALES") {
      current.salesTotal += record.amount;
    } else {
      current.expenseTotal += record.amount;
    }

    current.profit = current.salesTotal - current.expenseTotal;
    summaryMap.set(key, current);
  }

  return [...summaryMap.values()].sort((left, right) => {
    if (left.fiscalYear !== right.fiscalYear) {
      return right.fiscalYear - left.fiscalYear;
    }

    if (left.half !== right.half) {
      return left.half.localeCompare(right.half);
    }

    return left.storeCode.localeCompare(right.storeCode);
  });
}

const stores = buildStores();
const rawRecords = buildRawRecords(stores);
const normalizedRecords = buildNormalizedRecords(stores, rawRecords);
const summaryRecords = buildSummaryRecords(normalizedRecords);

export const mockFinanceSnapshot: FinanceSnapshot = {
  stores,
  rawRecords,
  normalizedRecords,
  summaryRecords,
  fiscalYears,
};

export function getAvailableHalves(): Half[] {
  return ["H1", "H2"];
}
