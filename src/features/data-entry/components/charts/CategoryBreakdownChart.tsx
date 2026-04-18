import { BarChart } from "@/src/components/charts";
import type { ChartPoint } from "@/src/types/chart";

type Props = {
  data: ChartPoint[];
};

export function CategoryBreakdownChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/60 p-6 text-sm text-[var(--muted)]">
        売上カテゴリの入力があると、主要カテゴリの内訳をここで確認できます。
      </div>
    );
  }

  return <BarChart data={data} yLabel="売上カテゴリ内訳" />;
}
