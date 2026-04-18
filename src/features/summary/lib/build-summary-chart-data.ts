import type { MetricType, SummaryFilter } from "@/src/features/filters/types";
import type { ChartPoint, LineChartPoint, StackedChartPoint } from "@/src/types/chart";
import type { NormalizedRecord, SummaryRecord } from "@/src/types/domain";
import {
  getStoreColor,
  getCategoryColor,
  PL_COLORS,
} from "@/src/lib/constants/chart-colors";
import type {
  SummaryBreakdownMode,
  SummaryMainBarDatum,
  SummaryMainPeriodGroup,
  SummaryMainSelection,
  SummaryRow,
  CategoryPeriodGroup,
  StoreCategoryBar,
} from "@/src/features/summary/types";

export function buildMetricLabel(metric: SummaryFilter["metric"]) {
  switch (metric) {
    case "salesTotal":
      return "売上";
    case "expenseTotal":
      return "経費";
    case "profit":
      return "利益";
  }
}

function getMetricValue(record: SummaryRecord, metric: SummaryFilter["metric"]) {
  switch (metric) {
    case "salesTotal":
      return record.salesTotal;
    case "expenseTotal":
      return record.expenseTotal;
    case "profit":
      return record.profit;
  }
}

export function buildSummaryBarChartData(
  records: SummaryRecord[],
  filter: SummaryFilter,
): ChartPoint[] {
  if (filter.compareBy === "half") {
    const grouped = new Map<string, number>();
    records.forEach((record) => {
      grouped.set(record.half, (grouped.get(record.half) ?? 0) + getMetricValue(record, filter.metric));
    });
    return [...grouped.entries()].map(([label, value]) => ({
      label: label === "H1" ? "上期" : "下期",
      value,
    }));
  }

  const grouped = new Map<string, number>();
  records.forEach((record) => {
    grouped.set(record.storeName, (grouped.get(record.storeName) ?? 0) + getMetricValue(record, filter.metric));
  });

  return [...grouped.entries()].map(([label, value]) => ({
    label,
    value,
    color: getStoreColor(
      records.find((r) => r.storeName === label)?.storeCode ?? "",
    ),
  }));
}

export function buildSummaryLineChartData(
  records: SummaryRecord[],
  metric: SummaryFilter["metric"],
): LineChartPoint[] {
  const grouped = new Map<string, number>();
  records.forEach((record) => {
    const label = `${record.fiscalYear} ${record.half === "H1" ? "上期" : "下期"}`;
    grouped.set(label, (grouped.get(label) ?? 0) + getMetricValue(record, metric));
  });
  return [...grouped.entries()].map(([label, value]) => ({ label, value }));
}

export function buildSummaryStackedChartData(
  normalizedRecords: NormalizedRecord[],
): StackedChartPoint[] {
  const storeMap = new Map<string, Map<string, number>>();
  normalizedRecords.forEach((record) => {
    if (record.kind !== "SALES") return;
    const byStore = storeMap.get(record.storeCode) ?? new Map<string, number>();
    byStore.set(record.categoryName, (byStore.get(record.categoryName) ?? 0) + record.amount);
    storeMap.set(record.storeCode, byStore);
  });

  return [...storeMap.entries()].map(([storeCode, categories]) => ({
    label: storeCode,
    segments: [...categories.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value], index) => ({
        key: `${storeCode}-${label}`,
        label,
        value,
        color: getCategoryColor(index),
      })),
  }));
}

/** summary_records から X 軸の期間タイムラインを構築 */
export function buildPeriodTimeline(records: SummaryRecord[]) {
  return [...new Set(records.map((r) => `${r.fiscalYear}-${r.half}`))]
    .sort((a, b) => {
      const [ay, ah] = a.split("-");
      const [by, bh] = b.split("-");
      if (Number(ay) !== Number(by)) return Number(ay) - Number(by);
      return ah.localeCompare(bh);
    })
    .map((periodKey) => {
      const [year, half] = periodKey.split("-");
      return { periodKey, periodLabel: `${year}-${half}` };
    });
}

/** normalized_records から期間タイムラインを構築 */
export function buildNormalizedPeriodTimeline(records: NormalizedRecord[]) {
  return [...new Set(records.map((r) => `${r.fiscalYear}-${r.half}`))]
    .sort((a, b) => {
      const [ay, ah] = a.split("-");
      const [by, bh] = b.split("-");
      if (Number(ay) !== Number(by)) return Number(ay) - Number(by);
      return ah.localeCompare(bh);
    })
    .map((periodKey) => {
      const [year, half] = periodKey.split("-");
      return { periodKey, periodLabel: `${year}-${half}` };
    });
}

export function buildMainComparisonChartData(
  records: SummaryRecord[],
  options: {
    selectedStoreCodes: string[];
    breakdownMode: SummaryBreakdownMode;
    visiblePeriods: number;
    metric: MetricType;
  },
): SummaryMainPeriodGroup[] {
  const timeline = buildPeriodTimeline(records);
  const visibleTimeline = timeline.slice(-options.visiblePeriods);
  const targetStoreCodes =
    options.selectedStoreCodes.length > 0
      ? options.selectedStoreCodes
      : [...new Set(records.map((r) => r.storeCode))];

  return visibleTimeline.map(({ periodKey, periodLabel }) => {
    const [year, half] = periodKey.split("-");
    const periodRecords = records.filter(
      (r) =>
        r.fiscalYear === Number(year) &&
        r.half === half &&
        targetStoreCodes.includes(r.storeCode),
    );

    const bars = periodRecords.flatMap((record): SummaryMainBarDatum[] => {
      if (options.breakdownMode === "pl") {
        return [
          {
            key: `${periodKey}-${record.storeCode}-sales`,
            storeCode: record.storeCode,
            storeName: record.storeName,
            periodKey,
            periodLabel,
            metric: "sales",
            label: "売上",
            value: record.salesTotal,
            color: PL_COLORS.sales,
          },
          {
            key: `${periodKey}-${record.storeCode}-expense`,
            storeCode: record.storeCode,
            storeName: record.storeName,
            periodKey,
            periodLabel,
            metric: "expense",
            label: "経費",
            value: record.expenseTotal,
            color: PL_COLORS.expense,
          },
          {
            key: `${periodKey}-${record.storeCode}-profit`,
            storeCode: record.storeCode,
            storeName: record.storeName,
            periodKey,
            periodLabel,
            metric: "profit",
            label: "利益",
            value: record.profit,
            color: PL_COLORS.profit,
          },
        ];
      }

      return [
        {
          key: `${periodKey}-${record.storeCode}-${options.metric}`,
          storeCode: record.storeCode,
          storeName: record.storeName,
          periodKey,
          periodLabel,
          metric: options.metric,
          label: buildMetricLabel(options.metric),
          value: getMetricValue(record, options.metric),
          color: getStoreColor(record.storeCode),
        },
      ];
    });

    return { periodKey, periodLabel, bars };
  });
}

export function buildMainComparisonMaxValue(groups: SummaryMainPeriodGroup[]) {
  return Math.max(...groups.flatMap((g) => g.bars.map((b) => b.value)), 1);
}

/**
 * normalized_records からカテゴリ内訳の積み上げグラフデータを構築。
 * salesCategory / expenseCategory モード用。
 *
 * カテゴリの並び順・色は全期間の合計金額で1度だけ決定し、すべての期間で統一する。
 */
export function buildCategoryPeriodGroups(
  normalizedRecords: NormalizedRecord[],
  options: {
    selectedStoreCodes: string[];
    kind: "SALES" | "EXPENSE";
    visiblePeriods: number;
  },
): CategoryPeriodGroup[] {
  const targetKindRecords = normalizedRecords.filter((r) => r.kind === options.kind);
  const timeline = buildNormalizedPeriodTimeline(targetKindRecords);
  const visibleTimeline = timeline.slice(-options.visiblePeriods);

  const targetStoreCodes =
    options.selectedStoreCodes.length > 0
      ? options.selectedStoreCodes
      : [...new Set(targetKindRecords.map((r) => r.storeCode))];

  // ---- Step 1: 全期間・全対象店舗のカテゴリ合計を集計 ----
  const globalCategoryTotals = new Map<string, { name: string; total: number }>();
  targetKindRecords.forEach((r) => {
    if (!targetStoreCodes.includes(r.storeCode)) return;
    const entry = globalCategoryTotals.get(r.categoryCode) ?? {
      name: r.categoryName,
      total: 0,
    };
    globalCategoryTotals.set(r.categoryCode, {
      name: entry.name,
      total: entry.total + r.amount,
    });
  });

  // ---- Step 2: 全期間合計降順で固定ソート順・固定色インデックスを決める ----
  // 同じ categoryCode は全期間で同じ色・同じ積み上げ位置になる
  const sortedCategories = [...globalCategoryTotals.entries()].sort(
    (a, b) => b[1].total - a[1].total,
  );
  const categoryOrder = new Map<string, number>(
    sortedCategories.map(([code], i) => [code, i]),
  );

  // ---- Step 3: 各期間のデータ構築 ----
  return visibleTimeline.map(({ periodKey, periodLabel }) => {
    const [year, half] = periodKey.split("-");
    const periodRecords = targetKindRecords.filter(
      (r) =>
        r.fiscalYear === Number(year) &&
        r.half === half &&
        targetStoreCodes.includes(r.storeCode),
    );

    const stores: StoreCategoryBar[] = targetStoreCodes
      .map((storeCode) => {
        const storeRecords = periodRecords.filter((r) => r.storeCode === storeCode);
        if (storeRecords.length === 0) return null;

        // カテゴリ別に集計
        const categoryMap = new Map<string, { name: string; amount: number }>();
        storeRecords.forEach((r) => {
          const entry = categoryMap.get(r.categoryCode) ?? { name: r.categoryName, amount: 0 };
          categoryMap.set(r.categoryCode, { name: entry.name, amount: entry.amount + r.amount });
        });

        // 全期間合計による固定順序で並べ替え → 色・位置が全期間で統一される
        const segments = [...categoryMap.entries()]
          .map(([code, { name, amount }]) => ({
            categoryCode: code,
            categoryName: name,
            amount,
            color: getCategoryColor(categoryOrder.get(code) ?? 0),
          }))
          .sort(
            (a, b) =>
              (categoryOrder.get(a.categoryCode) ?? 999) -
              (categoryOrder.get(b.categoryCode) ?? 999),
          );

        const totalAmount = segments.reduce((sum, s) => sum + s.amount, 0);

        return {
          storeCode,
          storeName: storeRecords[0].storeName,
          periodKey,
          periodLabel,
          totalAmount,
          segments,
        } satisfies StoreCategoryBar;
      })
      .filter((s): s is StoreCategoryBar => s !== null);

    return { periodKey, periodLabel, stores };
  });
}

/**
 * summary_records から P/L 積み上げグラフデータを構築。
 * 全体の長さ = 売上合計、内訳 = 経費（下）+ 利益（上）。
 * pl モード用。
 */
export function buildPlPeriodGroups(
  records: SummaryRecord[],
  options: {
    selectedStoreCodes: string[];
    visiblePeriods: number;
  },
): CategoryPeriodGroup[] {
  const timeline = buildPeriodTimeline(records);
  const visibleTimeline = timeline.slice(-options.visiblePeriods);
  const targetStoreCodes =
    options.selectedStoreCodes.length > 0
      ? options.selectedStoreCodes
      : [...new Set(records.map((r) => r.storeCode))];

  return visibleTimeline.map(({ periodKey, periodLabel }) => {
    const [year, half] = periodKey.split("-");
    const periodRecords = records.filter(
      (r) =>
        r.fiscalYear === Number(year) &&
        r.half === half &&
        targetStoreCodes.includes(r.storeCode),
    );

    const stores: StoreCategoryBar[] = periodRecords.map((record) => {
      const expense = record.expenseTotal;
      const profit = Math.max(record.profit, 0); // 損失は 0 として表示

      return {
        storeCode: record.storeCode,
        storeName: record.storeName,
        periodKey,
        periodLabel,
        totalAmount: record.salesTotal,
        totalLabel: "売上合計",
        segments: [
          {
            categoryCode: "expense",
            categoryName: "経費",
            amount: expense,
            color: PL_COLORS.expense,
          },
          ...(profit > 0
            ? [
                {
                  categoryCode: "profit",
                  categoryName: "利益",
                  amount: profit,
                  color: PL_COLORS.profit,
                },
              ]
            : []),
        ],
      } satisfies StoreCategoryBar;
    });

    return { periodKey, periodLabel, stores };
  });
}

export function buildSummaryDetailRows(
  rows: SummaryRow[],
  selection: SummaryMainSelection | null,
) {
  if (!selection) return rows;
  const [year, half] = selection.periodKey.split("-");
  return rows.filter(
    (row) =>
      row.storeCode === selection.storeCode &&
      row.fiscalYear === Number(year) &&
      row.half === half,
  );
}
