import type { ComparisonBarChartProps } from "@/src/components/charts/types";
import { formatCompactCurrency } from "@/src/lib/format/finance";

export function ComparisonBarChartAdapter({
  data,
  maxValue,
  yLabel,
  onSelect,
}: ComparisonBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/60 p-6 text-sm text-[var(--muted)]">
        比較対象データがありません。店舗か期間条件を調整してください。
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
        <span>{yLabel}</span>
        <span>{formatCompactCurrency(maxValue)}</span>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
          {data.map((group) => (
            <div
              key={group.periodKey}
              className="flex min-w-[180px] flex-col rounded-[1.35rem] border border-[var(--line)] bg-white/80 p-4"
            >
              <div className="mb-4">
                <p className="text-sm font-semibold">{group.periodLabel}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {group.bars.length} comparisons
                </p>
              </div>
              <div className="flex h-72 items-end gap-2 rounded-[1rem] bg-[linear-gradient(180deg,_rgba(15,23,42,0.02),_rgba(15,23,42,0.08))] p-3">
                {group.bars.map((bar) => (
                  <button
                    key={bar.key}
                    type="button"
                    className="group flex h-full min-w-[34px] flex-1 items-end focus:outline-none"
                    onClick={() =>
                      onSelect({
                        storeCode: bar.storeCode,
                        periodKey: bar.periodKey,
                        metric: bar.metric,
                        label: bar.label,
                      })
                    }
                    title={`${bar.storeName} / ${bar.periodLabel} / ${bar.label} / ${formatCompactCurrency(bar.value)}`}
                  >
                    <div className="flex w-full flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-[0.9rem] transition-transform group-hover:-translate-y-1"
                        style={{
                          height: `${Math.max((bar.value / Math.max(maxValue, 1)) * 100, 4)}%`,
                          background: `linear-gradient(180deg, ${bar.color}, rgba(24,34,47,0.18))`,
                        }}
                      />
                      <div className="text-center">
                        <p className="text-[11px] font-semibold leading-4">{bar.storeName}</p>
                        <p className="text-[10px] leading-4 text-[var(--muted)]">{bar.label}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
