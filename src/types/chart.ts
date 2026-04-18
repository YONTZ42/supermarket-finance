export type ChartPoint = {
  label: string;
  value: number;
  color?: string;
};

export type LineChartPoint = {
  label: string;
  value: number;
};

export type StackedChartSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export type StackedChartPoint = {
  label: string;
  segments: StackedChartSegment[];
};
