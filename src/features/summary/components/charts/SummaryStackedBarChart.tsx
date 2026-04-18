import { StackedBarChart } from "@/src/components/charts";
import type { StackedChartPoint } from "@/src/types/chart";

type Props = {
  data: StackedChartPoint[];
};

export function SummaryStackedBarChart({ data }: Props) {
  return <StackedBarChart data={data} yLabel="売上カテゴリ構成" />;
}
