import { HorizontalBarChart } from "@/src/components/charts/visx/HorizontalBarChart";
import type { ChartPoint } from "@/src/types/chart";

type Props = {
  data: ChartPoint[];
};

export function CategoryBreakdownChart({ data }: Props) {
  return (
    <div>
      <p className="eyebrow mb-3">売上カテゴリ内訳</p>
      <HorizontalBarChart data={data} yLabel="売上カテゴリ内訳" />
    </div>
  );
}
