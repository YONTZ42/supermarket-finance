import { LineChartVisx } from "@/src/components/charts/visx/LineChartVisx";
import type { LineChartPoint } from "@/src/types/chart";

type Props = {
  data: LineChartPoint[];
};

export function EntryTrendChart({ data }: Props) {
  return (
    <div>
      <p className="eyebrow mb-3">入力総額 推移</p>
      <LineChartVisx
        data={data}
        yLabel="入力総額 推移"
        color="#0e7490"
        height={220}
      />
    </div>
  );
}
