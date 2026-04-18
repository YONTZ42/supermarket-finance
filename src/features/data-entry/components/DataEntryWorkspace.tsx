"use client";

import { useState } from "react";

import {
  buildEntryOverviewMetrics,
  buildEntryRows,
} from "@/src/features/data-entry/lib/build-entry-form-schema";
import {
  buildCategoryBreakdownChartData,
  buildEntryTrendChartData,
} from "@/src/features/data-entry/lib/build-entry-chart-data";
import { useStoreConfigQuery } from "@/src/features/data-entry/hooks/useStoreConfigQuery";
import { useRawRecordsQuery } from "@/src/features/data-entry/hooks/useRawRecordsQuery";
import { useRawRecordsMutation } from "@/src/features/data-entry/hooks/useRawRecordsMutation";
import { StoreSelector } from "@/src/features/data-entry/components/StoreSelector";
import { FiscalYearSelector } from "@/src/features/data-entry/components/FiscalYearSelector";
import { RawRecordForm } from "@/src/features/data-entry/components/RawRecordForm";
import { EntryTrendChart } from "@/src/features/data-entry/components/charts/EntryTrendChart";
import { CategoryBreakdownChart } from "@/src/features/data-entry/components/charts/CategoryBreakdownChart";
import { formatCompactCurrency } from "@/src/lib/format/finance";
import type { EntryGridValue } from "@/src/features/data-entry/types";
import type { StoreCode } from "@/src/types/domain";

type Props = {
  initialStoreCode: StoreCode;
  initialFiscalYear: number;
};

export function DataEntryWorkspace({ initialStoreCode, initialFiscalYear }: Props) {
  // --- All hooks must be before any conditional return ---
  const [storeCode, setStoreCode] = useState<StoreCode>(initialStoreCode);
  const [fiscalYear, setFiscalYear] = useState(initialFiscalYear);
  const [refreshKey, setRefreshKey] = useState(0);
  const [draftRows, setDraftRows] = useState<EntryGridValue[] | null>(null);
  const [extraFiscalYears, setExtraFiscalYears] = useState<number[]>([]);

  const { store, stores, fiscalYears, isLoading: isStoreLoading, error: storeError } =
    useStoreConfigQuery(storeCode);
  const { records: rawRecords, isLoading: isRecordsLoading, error: recordsError } =
    useRawRecordsQuery(storeCode, fiscalYear, refreshKey);
  const { save, isSaving, lastSavedAt } = useRawRecordsMutation();

  // --- Loading / null guard ---
  if (isStoreLoading || !store) {
    return (
      <div className="panel rounded-[1.75rem] p-8 text-sm text-[var(--muted)] text-center">
        店舗設定を読み込み中です...
      </div>
    );
  }

  // --- Derived values (store is non-null beyond this point) ---
  const allFiscalYears = [
    ...fiscalYears,
    ...extraFiscalYears.filter((y) => !fiscalYears.includes(y)),
  ].sort((a, b) => a - b);

  const rows = draftRows ?? buildEntryRows(store, fiscalYear, rawRecords);
  const trendData = buildEntryTrendChartData(rows, store);
  const breakdownData = buildCategoryBreakdownChartData(rows);
  const overview = buildEntryOverviewMetrics(store, rows);
  const errorMessage = storeError ?? recordsError;
  const hasDraft = draftRows !== null;

  const totalSales = rows
    .filter((r) => r.kind === "SALES")
    .reduce((sum, r) => sum + Object.values(r.valuesByPeriod).reduce((s, v) => s + v, 0), 0);
  const totalExpense = rows
    .filter((r) => r.kind === "EXPENSE")
    .reduce((sum, r) => sum + Object.values(r.valuesByPeriod).reduce((s, v) => s + v, 0), 0);
  const profit = totalSales - totalExpense;

  // --- Event handlers ---
  async function handleSave() {
    await save({ storeCode, fiscalYear, rows });
    setDraftRows(null);
    setRefreshKey((c) => c + 1);
  }

  function handleStoreChange(next: StoreCode) {
    setStoreCode(next);
    setDraftRows(null);
  }

  function handleFiscalYearChange(next: number) {
    setFiscalYear(next);
    setDraftRows(null);
  }

  function handleAddYear(year: number) {
    setExtraFiscalYears((current) =>
      current.includes(year) ? current : [...current, year],
    );
    setFiscalYear(year);
  }

  function handleAddItem(kind: "SALES" | "EXPENSE") {
    const tempCode = `TEMP_${kind}_${Date.now()}`;
    const newRow: EntryGridValue = {
      categoryCode: tempCode,
      categoryName: `新規${kind === "SALES" ? "売上" : "経費"}項目`,
      kind,
      valuesByPeriod: Object.fromEntries(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        store!.periodDefinitions.map((p) => [p.code, 0]),
      ),
    };
    setDraftRows([...rows, newRow]);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <section className="panel rounded-[2rem] p-6">
        <p className="eyebrow">Data Entry</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">店舗別データ登録</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              店舗ごとの入力ルールを確認しながら raw record を編集します。
              保存時は backend で正規化・再集計が走ります。
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div
              className={`status-badge ${
                isRecordsLoading
                  ? "status-muted"
                  : hasDraft
                  ? "status-warn"
                  : lastSavedAt
                  ? "status-good"
                  : "status-muted"
              }`}
            >
              {isRecordsLoading
                ? "読み込み中..."
                : hasDraft
                ? "未保存の変更あり"
                : lastSavedAt
                ? `最終保存 ${new Date(lastSavedAt).toLocaleTimeString("ja-JP")}`
                : "保存済み"}
            </div>
            <div className="status-badge status-muted">
              {store.name} · {fiscalYear}年度
            </div>
          </div>
        </div>
      </section>

      {errorMessage && (
        <section className="panel rounded-[1.75rem] p-5 text-sm text-rose-700 bg-rose-50/60">
          {errorMessage}
        </section>
      )}

      {/* Store / year selector */}
      <section className="panel rounded-[1.75rem] p-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">店舗選択</p>
            <StoreSelector stores={stores} value={storeCode} onChange={handleStoreChange} />
          </div>
          <div>
            <p className="eyebrow mb-3">年度選択</p>
            <FiscalYearSelector
              fiscalYears={allFiscalYears}
              value={fiscalYear}
              onChange={handleFiscalYearChange}
              onAddYear={handleAddYear}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div
            className="rounded-[1.25rem] p-4"
            style={{
              background:
                store.inputMode === "CUMULATIVE"
                  ? "rgba(6,182,212,0.08)"
                  : "rgba(245,158,11,0.08)",
            }}
          >
            <p className="text-xs text-[var(--muted)]">入力方式</p>
            <p className="mt-1 text-base font-semibold">
              {store.inputMode === "CUMULATIVE" ? "累積入力" : "期間入力"}
            </p>
          </div>
          <div className="rounded-[1.25rem] bg-white/80 p-4">
            <p className="text-xs text-[var(--muted)]">報告月</p>
            <p className="mt-1 text-base font-semibold">{store.reportMonths.join(" / ")}月</p>
          </div>
          <div className="rounded-[1.25rem] bg-white/80 p-4">
            <p className="text-xs text-[var(--muted)]">最新入力期間</p>
            <p className="mt-1 text-base font-semibold">
              {overview.latestPeriod?.code ?? "未入力"}
            </p>
          </div>
        </div>
      </section>

      {/* KPI mini row */}
      <div className="grid gap-3 md:grid-cols-3">
        {(
          [
            { label: "入力売上合計", value: totalSales, accent: "#0e7490" },
            { label: "入力経費合計", value: totalExpense, accent: "#b45309" },
            { label: "推定利益", value: profit, accent: profit >= 0 ? "#166534" : "#dc2626" },
          ] as const
        ).map((kpi) => (
          <div
            key={kpi.label}
            className="panel rounded-[1.5rem] p-4 flex items-center justify-between"
          >
            <p className="text-sm text-[var(--muted)]">{kpi.label}</p>
            <p className="text-xl font-semibold font-mono" style={{ color: kpi.accent }}>
              {formatCompactCurrency(kpi.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <RawRecordForm
          store={store}
          rows={rows}
          onChange={setDraftRows}
          onSubmit={handleSave}
          isSaving={isSaving}
          onAddItem={handleAddItem}
        />

        <div className="space-y-5">
          {/* Period totals */}
          <section className="panel rounded-[1.75rem] p-5">
            <p className="eyebrow mb-3">期間別入力総額</p>
            <div className="space-y-2">
              {overview.totalsByPeriod.map((period) => {
                const max = Math.max(
                  ...overview.totalsByPeriod.map((p) => p.total),
                  1,
                );
                return (
                  <div key={period.code} className="flex items-center gap-3">
                    <span className="text-xs text-[var(--muted)] w-10 shrink-0">{period.code}</span>
                    <div className="flex-1 rounded-full bg-black/5 h-4 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                        style={{ width: `${(period.total / max) * 100}%`, opacity: 0.75 }}
                      />
                    </div>
                    <span className="text-xs font-mono text-[var(--muted)] w-20 text-right shrink-0">
                      {formatCompactCurrency(period.total)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Trend chart */}
          <section className="panel rounded-[1.75rem] p-5">
            <EntryTrendChart data={trendData} />
          </section>

          {/* Category breakdown */}
          <section className="panel rounded-[1.75rem] p-5">
            <CategoryBreakdownChart data={breakdownData} />
          </section>
        </div>
      </div>
    </div>
  );
}
