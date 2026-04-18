import { LineChart } from "@/src/components/charts";
import type { LineChartPoint } from "@/src/types/chart";

type Props = {
  data: LineChartPoint[];
  metricLabel: string;
};

export function SummaryLineChart({ data, metricLabel }: Props) {
  return <LineChart data={data} yLabel={`${metricLabel} 推移`} />;
}
