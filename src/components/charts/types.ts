import type { ChartPoint, LineChartPoint, StackedChartPoint } from "@/src/types/chart";

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
