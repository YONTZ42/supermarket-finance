import { LineChart } from "@/src/components/charts";
import type { LineChartPoint } from "@/src/types/chart";

type Props = {
  data: LineChartPoint[];
};

export function EntryTrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/60 p-6 text-sm text-[var(--muted)]">
        入力済みデータがあると、期間ごとの推移をここに表示します。
      </div>
    );
  }

  return <LineChart data={data} yLabel="入力総額 推移" />;
}
