import { BarChart } from "@/src/components/charts";
import type { ChartPoint } from "@/src/types/chart";

type Props = {
  data: ChartPoint[];
  metricLabel: string;
};

export function SummaryBarChart({ data, metricLabel }: Props) {
  return <BarChart data={data} yLabel={`${metricLabel} 比較`} />;
}
