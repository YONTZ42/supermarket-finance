"use client";

import { useMemo, useState } from "react";

import { ComparisonBarChart } from "@/src/components/charts";
import {
  buildMainComparisonChartData,
  buildMainComparisonMaxValue,
} from "@/src/features/summary/lib/build-summary-chart-data";
import type {
  SummaryBreakdownMode,
  SummaryMainComparisonState,
  SummaryMainSelection,
} from "@/src/features/summary/types";
import type { MetricType } from "@/src/features/filters/types";
import type { SummaryRecord, StoreCode } from "@/src/types/domain";

type Props = {
  records: SummaryRecord[];
  availableStores: Array<{ code: string; name: string }>;
  metric: MetricType;
  onSelect: (selection: SummaryMainSelection | null) => void;
};

const breakdownModes: Array<{ value: SummaryBreakdownMode; label: string }> = [
  { value: "none", label: "合計のみ" },
  { value: "pl", label: "売上 / 経費 / 利益" },
  { value: "salesCategory", label: "売上カテゴリ内訳" },
  { value: "expenseCategory", label: "経費カテゴリ内訳" },
];

export function MainComparisonArea({
  records,
  availableStores,
  metric,
  onSelect,
}: Props) {
  const [state, setState] = useState<SummaryMainComparisonState>({
    selectedStoreCodes: [],
    breakdownMode: "none",
    visiblePeriods: 6,
    selection: null,
  });
  const activeStoreCodes =
    state.selectedStoreCodes.length > 0
      ? state.selectedStoreCodes
      : availableStores.map((store) => store.code as StoreCode);

  const chartData = useMemo(
    () =>
      buildMainComparisonChartData(records, {
        selectedStoreCodes: activeStoreCodes,
        breakdownMode: state.breakdownMode,
        visiblePeriods: state.visiblePeriods,
        metric,
      }),
    [records, activeStoreCodes, state.breakdownMode, state.visiblePeriods, metric],
  );

  const maxValue = buildMainComparisonMaxValue(chartData);

  function toggleStore(code: string) {
    setState((current) => {
      const currentCodes =
        current.selectedStoreCodes.length > 0
          ? current.selectedStoreCodes
          : availableStores.map((store) => store.code as StoreCode);
      const exists = currentCodes.includes(code as StoreCode);
      const nextStores = exists
        ? currentCodes.filter((item) => item !== code)
        : [...currentCodes, code as StoreCode];

      return {
        ...current,
        selectedStoreCodes: nextStores,
      };
    });
  }

  function handleSelect(selection: SummaryMainSelection) {
    setState((current) => ({ ...current, selection }));
    onSelect(selection);
  }

  const categoryBreakdownRequested =
    state.breakdownMode === "salesCategory" ||
    state.breakdownMode === "expenseCategory";

  return (
    <section className="panel rounded-[1.75rem] p-5">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="eyebrow">Main Comparison</p>
            <h2 className="mt-1 text-2xl font-semibold">全店舗・全期間 比較</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--muted)]">
              期間ごとに店舗比較を並べ、クリックした棒を下部詳細表に反映します。
              現状の API で取れる summary_records を基準に、まずは経営判断に必要な主比較を先行実装しています。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="secondary-action"
              onClick={() =>
                setState((current) => ({
                  ...current,
                  visiblePeriods: Math.max(2, current.visiblePeriods - 2),
                }))
              }
            >
              ズームイン
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={() =>
                setState((current) => ({
                  ...current,
                  visiblePeriods: Math.min(12, current.visiblePeriods + 2),
                }))
              }
            >
              ズームアウト
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={() =>
                setState((current) => ({
                  ...current,
                  visiblePeriods: 6,
                  selection: null,
                }))
              }
            >
              リセットズーム
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-4">
            <div className="rounded-[1.35rem] border border-[var(--line)] bg-white/70 p-4">
              <p className="text-sm font-semibold">比較対象店舗</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {availableStores.map((store) => {
                  const active = activeStoreCodes.includes(store.code as StoreCode);

                  return (
                    <button
                      key={store.code}
                      type="button"
                      onClick={() => toggleStore(store.code)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-[var(--ink)] text-white"
                          : "border border-[var(--line)] bg-white text-[var(--ink)]"
                      }`}
                    >
                      {store.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-[var(--line)] bg-white/70 p-4">
              <p className="text-sm font-semibold">breakdownMode</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {breakdownModes.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() =>
                      setState((current) => ({ ...current, breakdownMode: mode.value }))
                    }
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      state.breakdownMode === mode.value
                        ? "bg-[var(--accent-strong)] text-white"
                        : "border border-[var(--line)] bg-white text-[var(--ink)]"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {categoryBreakdownRequested ? (
              <div className="rounded-[1.35rem] border border-dashed border-[var(--line)] bg-white/60 p-4 text-sm text-[var(--muted)]">
                カテゴリ内訳表示には category 単位の summary 用データが必要です。現 API では summary_records のみ返るため、
                この mode はプレースホルダーにしています。
              </div>
            ) : (
              <ComparisonBarChart
                data={chartData}
                maxValue={maxValue}
                yLabel="年度-半期 × 店舗 比較"
                onSelect={handleSelect}
              />
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-[1.35rem] border border-[var(--line)] bg-white/70 p-4">
              <p className="text-sm font-semibold">現在の表示</p>
              <div className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
                <span>指標: {metric}</span>
                <span>店舗数: {state.selectedStoreCodes.length}</span>
                <span>実選択店舗数: {activeStoreCodes.length}</span>
                <span>表示期間数: {chartData.length}</span>
                <span>breakdown: {state.breakdownMode}</span>
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-[var(--line)] bg-white/70 p-4">
              <p className="text-sm font-semibold">クリック対象</p>
              {state.selection ? (
                <div className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
                  <span>店舗: {state.selection.storeCode}</span>
                  <span>期間: {state.selection.periodKey}</span>
                  <span>項目: {state.selection.label}</span>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--muted)]">
                  棒をクリックすると、下部の詳細表をその対象に合わせます。
                </p>
              )}
            </div>

            <div className="rounded-[1.35rem] border border-[var(--line)] bg-white/70 p-4">
              <p className="text-sm font-semibold">追加分析カード</p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                次段階で独立 filter を持つ比較カードをここに追加します。今回はメイン比較エリアを優先実装しています。
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
