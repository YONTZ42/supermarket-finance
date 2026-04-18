import { formatInputMode, formatPeriodLabel } from "@/src/lib/format/finance";
import type { EntryGridValue, StoreConfigViewModel } from "@/src/features/data-entry/types";
import type { RawRecord, StoreConfig } from "@/src/types/domain";

export function buildStoreConfigViewModel(store: StoreConfig): StoreConfigViewModel {
  return {
    ...store,
    salesCategories: store.categories.filter((category) => category.kind === "SALES"),
    expenseCategories: store.categories.filter((category) => category.kind === "EXPENSE"),
    inputModeLabel: formatInputMode(store.inputMode),
  };
}

export function buildReportingHints(store: StoreConfig) {
  return store.periodDefinitions.map((period) => ({
    code: period.code,
    label: formatPeriodLabel(period.reportMonth, period.coveredMonths),
    half: period.half,
    reportMonth: period.reportMonth,
    coveredMonths: period.coveredMonths,
    inputMode: store.inputMode,
  }));
}

export function buildEntryModeGuidance(store: StoreConfig) {
  if (store.inputMode === "CUMULATIVE") {
    return {
      tone: "cumulative" as const,
      title: "累積入力",
      description:
        "各報告月には、その時点までの累積金額を入力します。前回までの累積を含んだ値であることを前提に backend が差分計算します。",
      guard:
        "前回報告月より小さい値を入れると不自然な累積になるため、元データを確認してから保存してください。",
    };
  }

  return {
    tone: "periodic" as const,
    title: "期間入力",
    description:
      "各報告月には、その期間だけに発生した金額を入力します。四半期や半期ごとの増分をそのまま登録してください。",
    guard:
      "対象期間が重複しないように、該当期間の実績だけを入力してください。累積値は入れないでください。",
  };
}

export function buildEntryOverviewMetrics(store: StoreConfig, rows: EntryGridValue[]) {
  const totalsByPeriod = store.periodDefinitions.map((period) => ({
    code: period.code,
    label: formatPeriodLabel(period.reportMonth, period.coveredMonths),
    total: rows.reduce((sum, row) => sum + (row.valuesByPeriod[period.code] ?? 0), 0),
  }));

  const latestPeriod = [...totalsByPeriod]
    .reverse()
    .find((period) => period.total > 0) ?? totalsByPeriod[totalsByPeriod.length - 1];

  return {
    salesCategoryCount: store.categories.filter((category) => category.kind === "SALES").length,
    expenseCategoryCount: store.categories.filter((category) => category.kind === "EXPENSE").length,
    latestPeriod,
    totalsByPeriod,
  };
}

export function buildEntryRows(
  store: StoreConfig,
  fiscalYear: number,
  rawRecords: RawRecord[],
): EntryGridValue[] {
  return store.categories.map((category) => {
    const valuesByPeriod = Object.fromEntries(
      store.periodDefinitions.map((period) => {
        const record = rawRecords.find(
          (item) =>
            item.storeCode === store.code &&
            item.fiscalYear === fiscalYear &&
            item.categoryCode === category.code &&
            item.periodCode === period.code,
        );

        return [period.code, record?.rawAmount ?? 0];
      }),
    );

    return {
      categoryCode: category.code,
      categoryName: category.name,
      kind: category.kind,
      valuesByPeriod,
    };
  });
}
