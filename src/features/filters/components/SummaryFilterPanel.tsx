"use client";

import type { SummaryFilter } from "@/src/features/filters/types";

type Props = {
  filter: SummaryFilter;
  fiscalYears: number[];
  stores: Array<{ code: string; name: string }>;
  onChange: (next: SummaryFilter) => void;
};

export function SummaryFilterPanel({ filter, fiscalYears, stores, onChange }: Props) {
  return (
    <section className="panel rounded-[1.75rem] p-5">
      <div className="flex flex-wrap gap-3">
        <label className="select-chip">
          <span>年度</span>
          <select
            value={filter.fiscalYear}
            onChange={(event) =>
              onChange({ ...filter, fiscalYear: Number(event.target.value) })
            }
          >
            {fiscalYears.map((fiscalYear) => (
              <option key={fiscalYear} value={fiscalYear}>
                {fiscalYear}
              </option>
            ))}
          </select>
        </label>

        <label className="select-chip">
          <span>店舗</span>
          <select
            value={filter.storeCode}
            onChange={(event) =>
              onChange({
                ...filter,
                storeCode: event.target.value as SummaryFilter["storeCode"],
              })
            }
          >
            <option value="ALL">全店舗</option>
            {stores.map((store) => (
              <option key={store.code} value={store.code}>
                {store.name}
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

        <label className="select-chip">
          <span>比較軸</span>
          <select
            value={filter.compareBy}
            onChange={(event) =>
              onChange({
                ...filter,
                compareBy: event.target.value as SummaryFilter["compareBy"],
              })
            }
          >
            <option value="store">店舗比較</option>
            <option value="half">半期比較</option>
          </select>
        </label>

        <label className="select-chip">
          <span>チャート</span>
          <select
            value={filter.chartType}
            onChange={(event) =>
              onChange({
                ...filter,
                chartType: event.target.value as SummaryFilter["chartType"],
              })
            }
          >
            <option value="bar">棒グラフ</option>
            <option value="line">推移</option>
            <option value="stacked">積み上げ</option>
          </select>
        </label>
      </div>
      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
        現在はモックデータで表示しています。server 実装後は同じ filter shape を API に渡す前提です。
      </p>
    </section>
  );
}
