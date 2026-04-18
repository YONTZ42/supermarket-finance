import type { ChartPoint, LineChartPoint } from "@/src/types/chart";
import type { EntryGridValue } from "@/src/features/data-entry/types";
import type { StoreConfig } from "@/src/types/domain";

const palette = ["#155e75", "#0f766e", "#d97706", "#2563eb", "#be185d", "#4f46e5"];

export function buildEntryTrendChartData(
  rows: EntryGridValue[],
  store: StoreConfig,
): LineChartPoint[] {
  return store.periodDefinitions.map((period) => {
    const total = rows.reduce((sum, row) => sum + (row.valuesByPeriod[period.code] ?? 0), 0);

    return {
      label: period.code,
      value: total,
    };
  });
}

export function buildCategoryBreakdownChartData(rows: EntryGridValue[]): ChartPoint[] {
  return rows
    .filter((row) => row.kind === "SALES")
    .map((row, index) => ({
      label: row.categoryName,
      value: Object.values(row.valuesByPeriod).reduce((sum, value) => sum + value, 0),
      color: palette[index % palette.length],
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 5);
}
