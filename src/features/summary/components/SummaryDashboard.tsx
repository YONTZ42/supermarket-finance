"use client";

import { useState } from "react";

import { SummaryFilterPanel } from "@/src/features/filters/components/SummaryFilterPanel";
import { createDefaultSummaryFilter } from "@/src/features/filters/lib/filter-schema";
import { buildSummaryDetailRows } from "@/src/features/summary/lib/build-summary-chart-data";
import { useSummaryQuery } from "@/src/features/summary/hooks/useSummaryQuery";
import { useNormalizedQuery } from "@/src/features/summary/hooks/useNormalizedQuery";
import { KpiCards } from "@/src/features/summary/components/KpiCards";
import { SummaryTable } from "@/src/features/summary/components/SummaryTable";
import { MainComparisonArea } from "@/src/features/summary/components/MainComparisonArea";
import { AnalysisCardsArea } from "@/src/features/summary/components/AnalysisCardsArea";
import { formatPercent } from "@/src/lib/format/finance";
import type { KpiCardData } from "@/src/features/summary/types";
import type { SummaryMainSelection } from "@/src/features/summary/types";

type Props = {
  initialFiscalYear: number;
};

export function SummaryDashboard({ initialFiscalYear }: Props) {
  const [filter, setFilter] = useState(createDefaultSummaryFilter());
  const [selection, setSelection] = useState<SummaryMainSelection | null>(null);
  const [tableMode, setTableMode] = useState<"global" | "selection">("global");
  const query = useSummaryQuery(filter);
  const normalizedQuery = useNormalizedQuery(filter);

  const cards: KpiCardData[] = (() => {
    const salesTotal = query.records.reduce((sum, r) => sum + r.salesTotal, 0);
    const expenseTotal = query.records.reduce((sum, r) => sum + r.expenseTotal, 0);
    const profit = query.records.reduce((sum, r) => sum + r.profit, 0);
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
        helper: "売上と経費の差分。店舗横断比較の主指標です。",
      },
      {
        id: "margin-rate",
        label: "利益率",
        value: marginRate,
        helper: "経営層が収益性を一目で把握するための補助指標です。",
      },
    ];
  })();

  const tableRows = buildSummaryDetailRows(
    query.rows,
    tableMode === "selection" ? selection : null,
  );

  function handleSelect(sel: SummaryMainSelection | null) {
    setSelection(sel);
    if (sel) setTableMode("selection");
  }

  return (
    <div className="space-y-4">
      {/* Compact top bar: title + status + filter */}
      <section className="panel rounded-[1.75rem] px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-between">
          <div className="flex items-center gap-3 shrink-0">
            <h1 className="text-base font-semibold">半期サマリ</h1>
            <div
              className={`status-badge ${
                query.error ? "status-warn" : query.isLoading ? "status-muted" : "status-good"
              }`}
            >
              {query.error ? "api error" : query.isLoading ? "loading..." : "api connected"}
            </div>
          </div>
          <SummaryFilterPanel
            filter={filter}
            fiscalYears={
              query.availableFiscalYears.length > 0
                ? query.availableFiscalYears
                : [initialFiscalYear]
            }
            onChange={setFilter}
            bare
          />
        </div>
      </section>

      {query.error && (
        <section className="panel rounded-[1.5rem] px-5 py-3 text-sm text-rose-700 bg-rose-50/60">
          {query.error}
        </section>
      )}

      {/* KPI cards */}
      <KpiCards cards={cards} />

      {/* Main comparison */}
      <MainComparisonArea
        records={query.records}
        normalizedRecords={normalizedQuery.records}
        normalizedLoading={normalizedQuery.isLoading}
        availableStores={query.availableStores}
        metric={filter.metric}
        onSelect={handleSelect}
      />

      {/* Analysis cards */}
      <AnalysisCardsArea
        records={query.records}
        availableStores={query.availableStores}
        availableFiscalYears={
          query.availableFiscalYears.length > 0
            ? query.availableFiscalYears
            : [initialFiscalYear]
        }
      />

      {/* Detail table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide">詳細一覧</h2>

          <div className="flex items-center gap-3">
            <div className="flex rounded-full border border-[var(--line)] overflow-hidden bg-white/70">
              <button
                type="button"
                onClick={() => setTableMode("global")}
                className={`px-3.5 py-1.5 text-sm font-medium transition ${
                  tableMode === "global"
                    ? "bg-[var(--ink)] text-white"
                    : "text-[var(--muted)] hover:bg-black/5"
                }`}
              >
                全体
              </button>
              <button
                type="button"
                onClick={() => setTableMode("selection")}
                disabled={!selection}
                className={`px-3.5 py-1.5 text-sm font-medium transition ${
                  tableMode === "selection"
                    ? "bg-[var(--ink)] text-white"
                    : "text-[var(--muted)] hover:bg-black/5 disabled:opacity-40"
                }`}
              >
                選択中
              </button>
            </div>
            <div className="status-badge status-muted">{tableRows.length} rows</div>
          </div>
        </div>

        {tableMode === "selection" && selection && (
          <p className="text-xs text-[var(--accent-strong)]">
            {selection.storeCode} · {selection.periodKey} · {selection.label} のデータを表示中
          </p>
        )}

        <SummaryTable rows={tableRows} />
      </section>
    </div>
  );
}
