import type { StackedBarChartProps } from "@/src/components/charts/types";
import { formatCompactCurrency } from "@/src/lib/format/finance";

export function StackedBarChartAdapter({ data, yLabel }: StackedBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/60 p-6 text-sm text-[var(--muted)]">
        {yLabel} に必要な詳細データはまだ API から返っていません。
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map((item) => item.segments.reduce((sum, segment) => sum + segment.value, 0)),
    1,
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
        <span>{yLabel}</span>
        <span>{formatCompactCurrency(maxValue)}</span>
      </div>
      <div className="space-y-4">
        {data.map((item) => {
          const total = item.segments.reduce((sum, segment) => sum + segment.value, 0);

          return (
            <div key={item.label} className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">{item.label}</p>
                <p className="font-mono text-xs text-[var(--muted)]">
                  {formatCompactCurrency(total)}
                </p>
              </div>
              <div className="mt-3 flex h-4 overflow-hidden rounded-full bg-slate-100">
                {item.segments.map((segment) => (
                  <div
                    key={`${item.label}-${segment.key}`}
                    title={`${segment.label}: ${formatCompactCurrency(segment.value)}`}
                    style={{
                      width: `${(segment.value / Math.max(total, 1)) * 100}%`,
                      backgroundColor: segment.color,
                    }}
                  />
                ))}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {item.segments.map((segment) => (
                  <div key={segment.key} className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span>{segment.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
