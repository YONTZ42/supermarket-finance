import type { BarChartProps } from "@/src/components/charts/types";
import { formatCompactCurrency } from "@/src/lib/format/finance";

export function BarChartAdapter({ data, yLabel }: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/60 p-6 text-sm text-[var(--muted)]">
        {yLabel} に利用できるデータがまだありません。
      </div>
    );
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
        <span>{yLabel}</span>
        <span>{formatCompactCurrency(maxValue)}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {data.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-4"
          >
            <div className="flex h-40 items-end rounded-[1rem] bg-[linear-gradient(180deg,_rgba(15,23,42,0.02),_rgba(15,23,42,0.08))] p-3">
              <div
                className="w-full rounded-[0.9rem] bg-[linear-gradient(180deg,_rgba(14,116,144,0.9),_rgba(14,116,144,0.34))]"
                style={{
                  height: `${(item.value / maxValue) * 100}%`,
                  background: item.color
                    ? `linear-gradient(180deg, ${item.color}, rgba(14,116,144,0.18))`
                    : undefined,
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{item.label}</span>
              <span className="font-mono text-xs text-[var(--muted)]">
                {formatCompactCurrency(item.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
