import type { ChartPoint, LineChartPoint, StackedChartPoint } from "@/src/types/chart";
import type { SummaryMainPeriodGroup } from "@/src/features/summary/types";

export type BarChartProps = {
  data: ChartPoint[];
  yLabel: string;
};

export type LineChartProps = {
  data: LineChartPoint[];
  yLabel: string;
};

export type StackedBarChartProps = {
  data: StackedChartPoint[];
  yLabel: string;
};

export type ComparisonBarChartProps = {
  data: SummaryMainPeriodGroup[];
  maxValue: number;
  yLabel: string;
  onSelect: (detail: {
    storeCode: string;
    periodKey: string;
    metric: string;
    label: string;
  }) => void;
};
