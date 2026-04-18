"use client";

import { useState } from "react";

import { SummaryFilterPanel } from "@/src/features/filters/components/SummaryFilterPanel";
import { createDefaultSummaryFilter } from "@/src/features/filters/lib/filter-schema";
import {
  buildMetricLabel,
  buildSummaryBarChartData,
  buildSummaryLineChartData,
  buildSummaryStackedChartData,
} from "@/src/features/summary/lib/build-summary-chart-data";
import { useSummaryQuery } from "@/src/features/summary/hooks/useSummaryQuery";
import { KpiCards } from "@/src/features/summary/components/KpiCards";
import { SummaryTable } from "@/src/features/summary/components/SummaryTable";
import { SummaryBarChart } from "@/src/features/summary/components/charts/SummaryBarChart";
import { SummaryLineChart } from "@/src/features/summary/components/charts/SummaryLineChart";
import { SummaryStackedBarChart } from "@/src/features/summary/components/charts/SummaryStackedBarChart";
import type { KpiCardData } from "@/src/features/summary/types";

type Props = {
  initialFiscalYear: number;
};

export function SummaryDashboard({ initialFiscalYear }: Props) {
  const [filter, setFilter] = useState(createDefaultSummaryFilter(initialFiscalYear));
  const query = useSummaryQuery(filter);
  const metricLabel = buildMetricLabel(filter.metric);

  const cards: KpiCardData[] = (() => {
    const salesTotal = query.records.reduce((sum, record) => sum + record.salesTotal, 0);
    const expenseTotal = query.records.reduce((sum, record) => sum + record.expenseTotal, 0);
    const profit = query.records.reduce((sum, record) => sum + record.profit, 0);
    const marginRate = salesTotal === 0 ? 0 : (profit / salesTotal) * 100;

    return [
      {
        id: "sales-total",
        label: "売上合計",
        value: salesTotal,
        helper: "絞り込み条件に一致する店舗の売上を集約しています。",
      },
      {
        id: "expense-total",
        label: "経費合計",
        value: expenseTotal,
        helper: "販促費・物流費を含む全経費の合計です。",
      },
      {
        id: "profit-total",
        label: "利益",
        value: profit,
        helper: "売上と経費の差分です。店舗横断比較の主指標です。",
      },
      {
        id: "margin-rate",
        label: "利益率",
        value: marginRate,
        helper: "経営層が収益性を一目で把握するための補助指標です。",
      },
    ];
  })();

  const chartSection = (() => {
    switch (filter.chartType) {
      case "bar":
        return (
          <SummaryBarChart
            data={buildSummaryBarChartData(query.records, filter)}
            metricLabel={metricLabel}
          />
        );
      case "line":
        return (
          <SummaryLineChart
            data={buildSummaryLineChartData(query.records, filter.metric)}
            metricLabel={metricLabel}
          />
        );
      case "stacked":
        return (
          <SummaryStackedBarChart
            data={buildSummaryStackedChartData(query.normalizedRecords)}
          />
        );
    }
  })();

  return (
    <div className="space-y-6">
      <section className="panel rounded-[2rem] p-6">
        <p className="eyebrow">Summary</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">半期サマリ</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              店舗差異を吸収した後の共通フォーマットで、売上・経費・利益を比較します。
              KPI、比較グラフ、一覧表を同じフィルタで同期させています。
            </p>
          </div>
          <div className={`status-badge ${query.error ? "status-warn" : "status-good"}`}>
            {query.error ? "api error" : query.isLoading ? "loading" : "api connected"}
          </div>
        </div>
      </section>

      {query.error ? (
        <section className="panel rounded-[1.75rem] p-5 text-sm text-rose-700">
          {query.error}
        </section>
      ) : null}

      <SummaryFilterPanel
        filter={filter}
        fiscalYears={
          query.availableFiscalYears.length > 0
            ? query.availableFiscalYears
            : [filter.fiscalYear]
        }
        stores={query.availableStores}
        onChange={setFilter}
      />

      <KpiCards cards={cards} />

      <section className="panel rounded-[1.75rem] p-5">{chartSection}</section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Tabular View</p>
            <h2 className="mt-1 text-xl font-semibold">比較一覧</h2>
          </div>
          <div className="status-badge status-muted">{query.rows.length} rows</div>
        </div>
        <SummaryTable rows={query.rows} />
      </section>
    </div>
  );
}
