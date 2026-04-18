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
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] mr-2">
          絞り込み
        </p>

        {/* Fiscal year */}
        <label className="select-chip">
          <span className="text-[var(--muted)]">年度</span>
          <select
            value={filter.fiscalYear}
            onChange={(e) =>
              onChange({
                ...filter,
                fiscalYear: e.target.value === "ALL" ? "ALL" : Number(e.target.value),
              })
            }
          >
            <option value="ALL">全期間</option>
            {fiscalYears.map((y) => (
              <option key={y} value={y}>{y}年度</option>
            ))}
          </select>
        </label>

        {/* Half */}
        <label className="select-chip">
          <span className="text-[var(--muted)]">半期</span>
          <select
            value={filter.half}
            onChange={(e) => onChange({ ...filter, half: e.target.value as SummaryFilter["half"] })}
          >
            <option value="ALL">通期</option>
            <option value="H1">上期</option>
            <option value="H2">下期</option>
          </select>
        </label>

        {/* Metric tabs */}
        <div className="flex rounded-full border border-[var(--line)] bg-white/70 overflow-hidden">
          {(
            [
              { value: "profit", label: "利益" },
              { value: "salesTotal", label: "売上" },
              { value: "expenseTotal", label: "経費" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...filter, metric: opt.value })}
              className={`px-3.5 py-1.5 text-sm font-medium transition ${
                filter.metric === opt.value
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--muted)] hover:bg-black/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
