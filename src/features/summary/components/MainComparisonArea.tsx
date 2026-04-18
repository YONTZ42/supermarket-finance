"use client";

import { useMemo, useState } from "react";

import { GroupedBarChart } from "@/src/components/charts/visx/GroupedBarChart";
import { StackedBarChart } from "@/src/components/charts/visx/StackedBarChart";
import {
  buildMainComparisonChartData,
  buildMainComparisonMaxValue,
  buildCategoryPeriodGroups,
  buildPlPeriodGroups,
} from "@/src/features/summary/lib/build-summary-chart-data";
import type {
  SummaryBreakdownMode,
  SummaryMainComparisonState,
  SummaryMainSelection,
} from "@/src/features/summary/types";
import type { MetricType } from "@/src/features/filters/types";
import type { NormalizedRecord, SummaryRecord, StoreCode } from "@/src/types/domain";
import { formatCompactCurrency } from "@/src/lib/format/finance";
import { getStoreColor } from "@/src/lib/constants/chart-colors";

type Props = {
  records: SummaryRecord[];
  normalizedRecords: NormalizedRecord[];
  availableStores: Array<{ code: string; name: string }>;
  metric: MetricType;
  onSelect: (selection: SummaryMainSelection | null) => void;
  normalizedLoading?: boolean;
};

const BREAKDOWN_MODES: Array<{ value: SummaryBreakdownMode; label: string; description: string }> = [
  { value: "none", label: "合計", description: "指標の合計で店舗比較" },
  { value: "pl", label: "P/L", description: "売上・経費・利益を並べて表示" },
  { value: "salesCategory", label: "売上内訳", description: "売上カテゴリ別積み上げ" },
  { value: "expenseCategory", label: "経費内訳", description: "経費カテゴリ別積み上げ" },
];

export function MainComparisonArea({
  records,
  normalizedRecords,
  availableStores,
  metric,
  onSelect,
  normalizedLoading = false,
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
      : availableStores.map((s) => s.code as StoreCode);

  const isCategoryMode =
    state.breakdownMode === "salesCategory" || state.breakdownMode === "expenseCategory";
  const isPlMode = state.breakdownMode === "pl";
  const isStackedMode = isCategoryMode || isPlMode;

  // --- Grouped bar chart data (none mode only) ---
  const groupedChartData = useMemo(
    () =>
      buildMainComparisonChartData(records, {
        selectedStoreCodes: activeStoreCodes,
        breakdownMode: state.breakdownMode,
        visiblePeriods: state.visiblePeriods,
        metric,
      }),
    [records, activeStoreCodes, state.breakdownMode, state.visiblePeriods, metric],
  );
  const maxValue = buildMainComparisonMaxValue(groupedChartData);

  // --- P/L 積み上げデータ ---
  const plChartData = useMemo(() => {
    if (!isPlMode) return [];
    return buildPlPeriodGroups(records, {
      selectedStoreCodes: activeStoreCodes,
      visiblePeriods: state.visiblePeriods,
    });
  }, [records, activeStoreCodes, state.visiblePeriods, isPlMode]);

  // --- カテゴリ積み上げデータ ---
  const categoryChartData = useMemo(() => {
    if (!isCategoryMode) return [];
    return buildCategoryPeriodGroups(normalizedRecords, {
      selectedStoreCodes: activeStoreCodes,
      kind: state.breakdownMode === "salesCategory" ? "SALES" : "EXPENSE",
      visiblePeriods: state.visiblePeriods,
    });
  }, [normalizedRecords, activeStoreCodes, state.breakdownMode, state.visiblePeriods, isCategoryMode]);

  // 積み上げグラフに渡すデータを選択
  const stackedChartData = isPlMode ? plChartData : categoryChartData;

  // Derive legend for grouped mode
  const groupedLegend = useMemo(() => {
    const seen = new Map<string, { label: string; color: string }>();
    groupedChartData.forEach((group) => {
      group.bars.forEach((bar) => {
        const key = state.breakdownMode === "pl" ? `${bar.storeCode}-${bar.metric}` : bar.storeCode;
        if (!seen.has(key)) {
          seen.set(key, {
            label: state.breakdownMode === "pl" ? `${bar.storeName} ${bar.label}` : bar.storeName,
            color: bar.color,
          });
        }
      });
    });
    return [...seen.values()];
  }, [groupedChartData, state.breakdownMode]);

  // 積み上げモードの凡例（P/L + カテゴリ共通）
  const stackedLegend = useMemo(() => {
    const seen = new Map<string, { label: string; color: string }>();
    stackedChartData.forEach((group) => {
      group.stores.forEach((store) => {
        store.segments.forEach((seg) => {
          if (!seen.has(seg.categoryCode)) {
            seen.set(seg.categoryCode, { label: seg.categoryName, color: seg.color });
          }
        });
      });
    });
    return [...seen.values()];
  }, [stackedChartData]);

  function toggleStore(code: string) {
    setState((current) => {
      const current_ =
        current.selectedStoreCodes.length > 0
          ? current.selectedStoreCodes
          : availableStores.map((s) => s.code as StoreCode);
      const exists = current_.includes(code as StoreCode);
      const next = exists
        ? current_.filter((c) => c !== code)
        : [...current_, code as StoreCode];
      return { ...current, selectedStoreCodes: next };
    });
  }

  function handleSelect(sel: SummaryMainSelection) {
    const isSame =
      state.selection?.storeCode === sel.storeCode &&
      state.selection?.periodKey === sel.periodKey &&
      state.selection?.metric === sel.metric;
    const next = isSame ? null : sel;
    setState((current) => ({ ...current, selection: next }));
    onSelect(next);
  }

  function handleStackedSelect(storeCode: string, periodKey: string) {
    const storeName =
      availableStores.find((store) => store.code === storeCode)?.name ?? storeCode;
    const label =
      state.breakdownMode === "pl"
        ? "P/L"
        : state.breakdownMode === "salesCategory"
        ? "売上カテゴリ"
        : "経費カテゴリ";

    handleSelect({
      storeCode,
      periodKey,
      metric: state.breakdownMode,
      label: `${storeName} ${label}`,
    });
  }

  return (
    <section className="panel rounded-[1.75rem] overflow-hidden">
      {/* Header */}
      <div className="border-b border-[var(--line)] px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">全店舗・全期間 比較</h2>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">表示期間</span>
            <div className="flex rounded-full border border-[var(--line)] bg-white/70 overflow-hidden">
              {[2, 4, 6, 8].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setState((c) => ({ ...c, visiblePeriods: n }))}
                  className={`px-3 py-1.5 text-xs font-semibold transition ${
                    state.visiblePeriods === n
                      ? "bg-[var(--ink)] text-white"
                      : "text-[var(--muted)] hover:bg-black/5"
                  }`}
                >
                  {n}期
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Controls row */}
        <div className="flex flex-wrap items-start gap-5">
          {/* Store filter */}
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
              比較店舗
            </p>
            <div className="flex flex-wrap gap-2">
              {availableStores.map((store) => {
                const active = activeStoreCodes.includes(store.code as StoreCode);
                const color = getStoreColor(store.code);
                return (
                  <button
                    key={store.code}
                    type="button"
                    onClick={() => toggleStore(store.code)}
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition border"
                    style={
                      active
                        ? { background: color, borderColor: color, color: "white" }
                        : { background: "rgba(255,255,255,0.7)", borderColor: "var(--line)", color: "var(--muted)" }
                    }
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: active ? "rgba(255,255,255,0.7)" : color }}
                    />
                    {store.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Breakdown mode */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
              表示モード
            </p>
            <div className="flex gap-1 rounded-xl border border-[var(--line)] bg-white/60 p-1">
              {BREAKDOWN_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  title={mode.description}
                  onClick={() =>
                    setState((c) => ({ ...c, breakdownMode: mode.value, selection: null }))
                  }
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition whitespace-nowrap ${
                    state.breakdownMode === mode.value
                      ? "bg-[var(--ink)] text-white shadow-sm"
                      : "text-[var(--muted)] hover:bg-black/5"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart area */}
        <div className="rounded-[1.35rem] border border-[var(--line)] bg-white/70 overflow-hidden">
          {isStackedMode ? (
            normalizedLoading && isCategoryMode ? (
              <div className="flex items-center justify-center p-8 text-sm text-[var(--muted)]" style={{ height: 400 }}>
                カテゴリデータを読み込み中...
              </div>
            ) : (
              <StackedBarChart
                groups={stackedChartData}
                height={480}
                onStoreClick={handleStackedSelect}
                showTotalFrame={isPlMode}
              />
            )
          ) : (
            <GroupedBarChart
              groups={groupedChartData}
              breakdownMode={state.breakdownMode}
              onSelect={handleSelect}
              selectedKey={
                state.selection
                  ? `${state.selection.periodKey}-${state.selection.storeCode}-${state.selection.metric}`
                  : null
              }
              height={480}
            />
          )}
        </div>

        {/* Legend */}
        {isStackedMode ? (
          stackedLegend.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {stackedLegend.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ background: item.color, opacity: 0.85 }}
                  />
                  {item.label}
                </div>
              ))}
            </div>
          )
        ) : (
          groupedLegend.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {groupedLegend.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ background: item.color, opacity: 0.85 }}
                  />
                  {item.label}
                </div>
              ))}
              {maxValue > 0 && (
                <div className="ml-auto text-xs text-[var(--muted)]">
                  最大値: {formatCompactCurrency(maxValue)}
                </div>
              )}
            </div>
          )
        )}

        {/* Selection badge (only in non-category mode) */}
        {state.selection && (
          <div className="flex items-center gap-3 rounded-xl bg-[var(--accent-soft)] px-4 py-3">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0" />
            <span className="text-sm text-[var(--accent-strong)] font-medium">
              選択中: {state.selection.periodKey} ·{" "}
              {availableStores.find((s) => s.code === state.selection?.storeCode)?.name ??
                state.selection.storeCode}{" "}
              · {state.selection.label}
            </span>
            <button
              type="button"
              className="ml-auto text-xs text-[var(--muted)] hover:text-[var(--ink)] transition"
              onClick={() => {
                setState((c) => ({ ...c, selection: null }));
                onSelect(null);
              }}
            >
              解除
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
