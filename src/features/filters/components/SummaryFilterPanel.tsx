"use client";

import type { SummaryFilter } from "@/src/features/filters/types";

type Props = {
  filter: SummaryFilter;
  fiscalYears: number[];
  onChange: (next: SummaryFilter) => void;
};

export function SummaryFilterPanel({ filter, fiscalYears, onChange }: Props) {
  return (
    <section className="panel rounded-[1.75rem] p-5">
      <div className="flex flex-wrap gap-3">
        <label className="select-chip">
          <span>年度</span>
          <select
            value={filter.fiscalYear}
            onChange={(event) =>
              onChange({
                ...filter,
                fiscalYear:
                  event.target.value === "ALL" ? "ALL" : Number(event.target.value),
              })
            }
          >
            <option value="ALL">全期間</option>
            {fiscalYears.map((fiscalYear) => (
              <option key={fiscalYear} value={fiscalYear}>
                {fiscalYear}
              </option>
            ))}
          </select>
        </label>

        <label className="select-chip">
          <span>半期</span>
          <select
            value={filter.half}
            onChange={(event) =>
              onChange({ ...filter, half: event.target.value as SummaryFilter["half"] })
            }
          >
            <option value="ALL">通期表示</option>
            <option value="H1">上期</option>
            <option value="H2">下期</option>
          </select>
        </label>

        <label className="select-chip">
          <span>指標</span>
          <select
            value={filter.metric}
            onChange={(event) =>
              onChange({ ...filter, metric: event.target.value as SummaryFilter["metric"] })
            }
          >
            <option value="profit">利益</option>
            <option value="salesTotal">売上</option>
            <option value="expenseTotal">経費</option>
          </select>
        </label>

      </div>
      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
        グローバル条件は期間と主指標だけを持ち、店舗複数選択や breakdown はメイン比較エリアで操作します。
      </p>
    </section>
  );
}
