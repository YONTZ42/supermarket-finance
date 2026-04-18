"use client";

import { useRef, useState } from "react";

import {
  buildEntryOverviewMetrics,
  buildEntryRows,
} from "@/src/features/data-entry/lib/build-entry-form-schema";
import {
  buildCategoryBreakdownChartData,
  buildEntryTrendChartData,
} from "@/src/features/data-entry/lib/build-entry-chart-data";
import {
  buildDirtyEntryRows,
  buildSelectableFiscalYears,
} from "@/src/features/data-entry/lib/build-save-payload";
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
  const saveToastTimeoutRef = useRef<number | null>(null);

  const { store, stores, fiscalYears, isLoading: isStoreLoading, error: storeError } =
    useStoreConfigQuery(storeCode);
  const { records: rawRecords, isLoading: isRecordsLoading, error: recordsError } =
    useRawRecordsQuery(storeCode, fiscalYear, refreshKey);
  const { save, isSaving, lastSavedAt, saveProgress } = useRawRecordsMutation();
  const [showSaveToast, setShowSaveToast] = useState(false);

  // --- Loading / null guard ---
  if (isStoreLoading || !store) {
    return (
      <div className="panel rounded-[1.75rem] p-8 text-sm text-[var(--muted)] text-center">
        店舗設定を読み込み中です...
      </div>
    );
  }

  // --- Derived values (store is non-null beyond this point) ---
  const allFiscalYears = buildSelectableFiscalYears(fiscalYears, fiscalYear, extraFiscalYears);
  const baseRows = buildEntryRows(store, fiscalYear, rawRecords);
  const rows = draftRows ?? baseRows;
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
    const dirtyRows = buildDirtyEntryRows(baseRows, rows);

    await save({
      storeCode,
      fiscalYear,
      rows: dirtyRows,
    });

    if (saveToastTimeoutRef.current) {
      window.clearTimeout(saveToastTimeoutRef.current);
    }

    setShowSaveToast(true);
    saveToastTimeoutRef.current = window.setTimeout(() => {
      setShowSaveToast(false);
      saveToastTimeoutRef.current = null;
    }, 2600);

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
    setDraftRows(null);
  }

  function handleAddItem(kind: "SALES" | "EXPENSE") {
    const tempCode = `TEMP_${kind}_${Date.now()}`;
    const newRow: EntryGridValue = {
      categoryCode: tempCode,
      categoryName: `新規${kind === "SALES" ? "売上" : "経費"}項目`,
      kind,
      valuesByPeriod: Object.fromEntries(
        store!.periodDefinitions.map((p) => [p.code, 0]),
      ),
      isCustom: true,
    };
    setDraftRows([...rows, newRow]);
  }

  return (
    <div className="space-y-4">
      {showSaveToast ? (
        <div className="save-toast save-toast-enter fixed right-5 top-5 z-50">
          <div className="rounded-[1.25rem] border border-emerald-200 bg-white/95 px-4 py-3 shadow-[0_20px_50px_rgba(22,101,52,0.18)] backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="save-toast-dot" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">保存が完了しました</p>
                <p className="text-xs text-emerald-700/80">
                  {store.name} / {fiscalYear}年度
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Compact top bar: title + status + store/year selectors + KPI */}
      <section className="panel rounded-[1.75rem] px-5 py-3 space-y-3">
        {/* Row 1: title + badges */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold">店舗別データ登録</h1>
            <div className="status-badge status-muted text-xs">
              {store.name} · {fiscalYear}年度
            </div>
          </div>
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
              : isSaving && saveProgress
              ? `保存中 ${saveProgress.current}/${saveProgress.total}`
              : hasDraft
              ? "未保存の変更あり"
              : lastSavedAt
              ? `保存済 ${new Date(lastSavedAt).toLocaleTimeString("ja-JP")}`
              : "保存済み"}
          </div>
        </div>

        {/* Row 2: selectors + store meta + KPI */}
        <div className="flex flex-wrap items-center gap-3">
          <StoreSelector stores={stores} value={storeCode} onChange={handleStoreChange} />
          <FiscalYearSelector
            fiscalYears={allFiscalYears}
            value={fiscalYear}
            onChange={handleFiscalYearChange}
            onAddYear={handleAddYear}
          />

          {/* Store meta chips */}
          <span className="text-xs rounded-full border border-[var(--line)] bg-white/70 px-3 py-1.5 text-[var(--muted)]">
            {store.inputMode === "CUMULATIVE" ? "累積入力" : "期間入力"}
          </span>
          <span className="text-xs rounded-full border border-[var(--line)] bg-white/70 px-3 py-1.5 text-[var(--muted)]">
            報告月 {store.reportMonths.join("/")}月
          </span>
          <span className="text-xs rounded-full border border-[var(--line)] bg-white/70 px-3 py-1.5 text-[var(--muted)]">
            最新 {overview.latestPeriod?.code ?? "未入力"}
          </span>

          {/* KPI mini values */}
          <div className="flex items-center gap-3 ml-auto">
            {(
              [
                { label: "売上", value: totalSales, color: "#0e7490" },
                { label: "経費", value: totalExpense, color: "#b45309" },
                { label: "利益", value: profit, color: profit >= 0 ? "#166534" : "#dc2626" },
              ] as const
            ).map((kpi) => (
              <div key={kpi.label} className="flex items-center gap-1.5">
                <span className="text-xs text-[var(--muted)]">{kpi.label}</span>
                <span className="text-sm font-semibold font-mono tabular-nums" style={{ color: kpi.color }}>
                  {formatCompactCurrency(kpi.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {errorMessage && (
        <section className="panel rounded-[1.5rem] px-5 py-3 text-sm text-rose-700 bg-rose-50/60">
          {errorMessage}
        </section>
      )}

      {/* Main grid: charts dominant (left), form secondary (right) */}
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Charts column */}
        <div className="space-y-4">
          {/* Trend chart */}
          <section className="panel rounded-[1.75rem] p-5">
            <EntryTrendChart data={trendData} />
          </section>

          {/* Category breakdown */}
          <section className="panel rounded-[1.75rem] p-5">
            <CategoryBreakdownChart data={breakdownData} />
          </section>

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
        </div>

        {/* Form column */}
        <RawRecordForm
          store={store}
          rows={rows}
          onChange={setDraftRows}
          onSubmit={handleSave}
          isSaving={isSaving}
          saveProgress={saveProgress}
          onAddItem={handleAddItem}
        />
      </div>
    </div>
  );
}
