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
import type { EntryGridValue } from "@/src/features/data-entry/types";
import type { StoreCode } from "@/src/types/domain";

type Props = {
  initialStoreCode: StoreCode;
  initialFiscalYear: number;
};

export function DataEntryWorkspace({ initialStoreCode, initialFiscalYear }: Props) {
  const [storeCode, setStoreCode] = useState<StoreCode>(initialStoreCode);
  const [fiscalYear, setFiscalYear] = useState(initialFiscalYear);
  const [refreshKey, setRefreshKey] = useState(0);
  const { store, stores, fiscalYears, isLoading: isStoreLoading, error: storeError } =
    useStoreConfigQuery(storeCode);
  const {
    records: rawRecords,
    isLoading: isRecordsLoading,
    error: recordsError,
  } = useRawRecordsQuery(storeCode, fiscalYear, refreshKey);
  const [draftRows, setDraftRows] = useState<EntryGridValue[] | null>(null);
  const { save, isSaving, lastSavedAt } = useRawRecordsMutation();

  async function handleSave() {
    await save({ storeCode, fiscalYear, rows });
    setDraftRows(null);
    setRefreshKey((current) => current + 1);
  }

  function handleStoreChange(nextStoreCode: StoreCode) {
    setStoreCode(nextStoreCode);
    setDraftRows(null);
  }

  function handleFiscalYearChange(nextFiscalYear: number) {
    setFiscalYear(nextFiscalYear);
    setDraftRows(null);
  }

  if (isStoreLoading || !store) {
    return (
      <div className="panel rounded-[1.75rem] p-6 text-sm text-[var(--muted)]">
        店舗設定を読み込み中です...
      </div>
    );
  }

  const rows = draftRows ?? buildEntryRows(store, fiscalYear, rawRecords);
  const trendData = buildEntryTrendChartData(rows, store);
  const breakdownData = buildCategoryBreakdownChartData(rows);
  const overview = buildEntryOverviewMetrics(store, rows);
  const errorMessage = storeError ?? recordsError;
  const isLoading = isRecordsLoading;

  return (
    <div className="space-y-6">
      <section className="panel rounded-[2rem] p-6">
        <p className="eyebrow">Data Entry</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">店舗別データ登録</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              店舗ごとの入力ルールを表示しながら、raw record を period ごとに編集します。
              API 経由で既存データを取得し、保存時は再計算まで backend に委譲します。
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className={`status-badge ${lastSavedAt ? "status-good" : "status-warn"}`}>
              {lastSavedAt ? `最終保存 ${new Date(lastSavedAt).toLocaleTimeString("ja-JP")}` : "未保存の変更あり"}
            </div>
            <div className="status-badge status-muted">
              {store.name} / {fiscalYear}年度
            </div>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <section className="panel rounded-[1.75rem] p-5 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      <section className="panel rounded-[1.75rem] p-5">
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="eyebrow">Store</p>
            <div className="mt-3">
              <StoreSelector stores={stores} value={storeCode} onChange={handleStoreChange} />
            </div>
          </div>
          <div>
            <p className="eyebrow">Fiscal Year</p>
            <div className="mt-3">
              <FiscalYearSelector
                fiscalYears={fiscalYears}
                value={fiscalYear}
                onChange={handleFiscalYearChange}
              />
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.25rem] bg-[var(--accent-soft)] p-4">
            <p className="text-sm text-[var(--muted)]">入力方式</p>
            <p className="mt-1 text-lg font-semibold">{store.inputModeLabel}</p>
          </div>
          <div className="rounded-[1.25rem] bg-white/80 p-4">
            <p className="text-sm text-[var(--muted)]">報告月</p>
            <p className="mt-1 text-lg font-semibold">{store.reportMonths.join(" / ")}月</p>
          </div>
          <div className="rounded-[1.25rem] bg-white/80 p-4">
            <p className="text-sm text-[var(--muted)]">最新入力期間</p>
            <p className="mt-1 text-lg font-semibold">
              {overview.latestPeriod ? overview.latestPeriod.code : "未入力"}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <RawRecordForm
          store={store}
          rows={rows}
          onChange={setDraftRows}
          onSubmit={handleSave}
          isSaving={isSaving}
        />

        <div className="space-y-6">
          <section className="panel rounded-[1.75rem] p-5">
            <p className="eyebrow">Input Summary</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[1.25rem] bg-[var(--accent-soft)] p-4">
                <p className="text-sm text-[var(--muted)]">売上カテゴリ数</p>
                <p className="mt-1 text-lg font-semibold">{overview.salesCategoryCount}</p>
              </div>
              <div className="rounded-[1.25rem] bg-white/80 p-4">
                <p className="text-sm text-[var(--muted)]">経費カテゴリ数</p>
                <p className="mt-1 text-lg font-semibold">{overview.expenseCategoryCount}</p>
              </div>
              <div className="rounded-[1.25rem] bg-white/80 p-4">
                <p className="text-sm text-[var(--muted)]">読込状態</p>
                <p className="mt-1 text-lg font-semibold">{isLoading ? "取得中" : "取得済み"}</p>
              </div>
            </div>
            <div className="mt-4 rounded-[1.25rem] border border-[var(--line)] bg-white/70 p-4">
              <p className="text-sm font-semibold">期間ごとの入力総額</p>
              <div className="mt-3 grid gap-2">
                {overview.totalsByPeriod.map((period) => (
                  <div key={period.code} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--muted)]">{period.code} / {period.label}</span>
                    <span className="font-mono">{period.total.toLocaleString("ja-JP")}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="panel rounded-[1.75rem] p-5">
            <EntryTrendChart data={trendData} />
          </section>

          <section className="panel rounded-[1.75rem] p-5">
            <CategoryBreakdownChart data={breakdownData} />
          </section>
        </div>
      </div>
    </div>
  );
}
