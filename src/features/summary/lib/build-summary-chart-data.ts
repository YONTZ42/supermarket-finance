import type { MetricType, SummaryFilter } from "@/src/features/filters/types";
import type { ChartPoint, LineChartPoint, StackedChartPoint } from "@/src/types/chart";
import type { NormalizedRecord, SummaryRecord } from "@/src/types/domain";
import type {
  SummaryBreakdownMode,
  SummaryMainBarDatum,
  SummaryMainPeriodGroup,
  SummaryMainSelection,
  SummaryRow,
} from "@/src/features/summary/types";

const chartPalette = ["#155e75", "#0f766e", "#b45309", "#2563eb", "#be185d", "#475569"];

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

function getMetricValue(
  record: SummaryRecord,
  metric: SummaryFilter["metric"],
) {
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

    return [...grouped.entries()].map(([label, value], index) => ({
      label: label === "H1" ? "上期" : "下期",
      value,
      color: chartPalette[index],
    }));
  }

  const grouped = new Map<string, number>();
  records.forEach((record) => {
    grouped.set(record.storeName, (grouped.get(record.storeName) ?? 0) + getMetricValue(record, filter.metric));
  });

  return [...grouped.entries()].map(([label, value], index) => ({
    label,
    value,
    color: chartPalette[index],
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

  return [...grouped.entries()].map(([label, value]) => ({
    label,
    value,
  }));
}

export function buildSummaryStackedChartData(
  normalizedRecords: NormalizedRecord[],
): StackedChartPoint[] {
  const storeMap = new Map<string, Map<string, number>>();

  normalizedRecords.forEach((record) => {
    if (record.kind !== "SALES") {
      return;
    }

    const byStore = storeMap.get(record.storeCode) ?? new Map<string, number>();
    byStore.set(record.categoryName, (byStore.get(record.categoryName) ?? 0) + record.amount);
    storeMap.set(record.storeCode, byStore);
  });

  return [...storeMap.entries()].map(([storeCode, categories]) => ({
    label: storeCode,
    segments: [...categories.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([label, value], index) => ({
        key: `${storeCode}-${label}`,
        label,
        value,
        color: chartPalette[index],
      })),
  }));
}

function getStoreColor(storeCode: string, offset = 0) {
  const code = storeCode
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return chartPalette[(code + offset) % chartPalette.length];
}

export function buildPeriodTimeline(records: SummaryRecord[]) {
  return [...new Set(records.map((record) => `${record.fiscalYear}-${record.half}`))]
    .sort((left, right) => {
      const [leftYear, leftHalf] = left.split("-");
      const [rightYear, rightHalf] = right.split("-");
      if (Number(leftYear) !== Number(rightYear)) {
        return Number(leftYear) - Number(rightYear);
      }

      return leftHalf.localeCompare(rightHalf);
    })
    .map((periodKey) => {
      const [year, half] = periodKey.split("-");
      return {
        periodKey,
        periodLabel: `${year}-${half}`,
      };
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
      : [...new Set(records.map((record) => record.storeCode))];

  return visibleTimeline.map(({ periodKey, periodLabel }) => {
    const [year, half] = periodKey.split("-");
    const periodRecords = records.filter(
      (record) =>
        record.fiscalYear === Number(year) &&
        record.half === half &&
        targetStoreCodes.includes(record.storeCode),
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
            color: "#0f766e",
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
            color: "#b45309",
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
            color: getStoreColor(record.storeCode, 1),
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

    return {
      periodKey,
      periodLabel,
      bars,
    };
  });
}

export function buildMainComparisonMaxValue(groups: SummaryMainPeriodGroup[]) {
  return Math.max(
    ...groups.flatMap((group) => group.bars.map((bar) => bar.value)),
    1,
  );
}

export function buildSummaryDetailRows(
  rows: SummaryRow[],
  selection: SummaryMainSelection | null,
) {
  if (!selection) {
    return rows;
  }

  const [year, half] = selection.periodKey.split("-");
  return rows.filter(
    (row) =>
      row.storeCode === selection.storeCode &&
      row.fiscalYear === Number(year) &&
      row.half === half,
  );
}
