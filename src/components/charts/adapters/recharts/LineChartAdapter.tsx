import type { LineChartProps } from "@/src/components/charts/types";
import { formatCompactCurrency } from "@/src/lib/format/finance";

export function LineChartAdapter({ data, yLabel }: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/60 p-6 text-sm text-[var(--muted)]">
        {yLabel} に利用できるデータがまだありません。
      </div>
    );
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const minValue = Math.min(...data.map((item) => item.value), 0);
  const range = Math.max(maxValue - minValue, 1);

  const points = data
    .map((point, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 100;
      const y = 100 - ((point.value - minValue) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-5">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
        <span>{yLabel}</span>
        <span>{formatCompactCurrency(maxValue)}</span>
      </div>
      <svg
        className="mt-4 h-56 w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-label={yLabel}
      >
        <defs>
          <linearGradient id="summary-line-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(14,116,144,0.22)" />
            <stop offset="100%" stopColor="rgba(14,116,144,0.02)" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke="rgba(14,116,144,0.95)"
          strokeWidth="2.4"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
        {data.map((point, index) => {
          const x = (index / Math.max(data.length - 1, 1)) * 100;
          const y = 100 - ((point.value - minValue) / range) * 100;

          return (
            <circle
              key={point.label}
              cx={x}
              cy={y}
              r="2.3"
              fill="white"
              stroke="rgba(14,116,144,0.95)"
              strokeWidth="1.4"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {data.map((point) => (
          <div key={point.label} className="rounded-2xl bg-[var(--accent-soft)] px-3 py-2">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{point.label}</p>
            <p className="mt-1 text-sm font-semibold">{formatCompactCurrency(point.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
