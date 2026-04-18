import type { SummaryFilter } from "@/src/features/filters/types";
import type { ChartPoint, LineChartPoint, StackedChartPoint } from "@/src/types/chart";
import type { NormalizedRecord, SummaryRecord } from "@/src/types/domain";

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
