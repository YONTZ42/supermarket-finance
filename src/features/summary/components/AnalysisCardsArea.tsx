"use client";

import { useState, useMemo } from "react";

import { GroupedBarChart } from "@/src/components/charts/visx/GroupedBarChart";
import { LineChartVisx } from "@/src/components/charts/visx/LineChartVisx";
import { buildPeriodTimeline } from "@/src/features/summary/lib/build-summary-chart-data";
import { formatCompactCurrency } from "@/src/lib/format/finance";
import { getStoreColor, PL_COLORS } from "@/src/lib/constants/chart-colors";
import type { SummaryRecord, StoreCode, Half } from "@/src/types/domain";
import type { MetricType } from "@/src/features/filters/types";
import type { SummaryMainPeriodGroup } from "@/src/features/summary/types";

type CompareBy = "time" | "store";
type ChartType = "bar" | "line";

type AnalysisCard = {
  id: string;
  title: string;
  storeCodes: StoreCode[];
  fiscalYear: number | "ALL";
  half: Half | "ALL";
  metric: MetricType;
  compareBy: CompareBy;
  chartType: ChartType;
};

const METRIC_LABELS: Record<MetricType, string> = {
  salesTotal: "売上",
  expenseTotal: "経費",
  profit: "利益",
};

const METRIC_COLORS: Record<MetricType, string> = {
  salesTotal: PL_COLORS.sales,
  expenseTotal: PL_COLORS.expense,
  profit: PL_COLORS.profit,
};

function getMetricValue(r: SummaryRecord, metric: MetricType) {
  switch (metric) {
    case "salesTotal": return r.salesTotal;
    case "expenseTotal": return r.expenseTotal;
    case "profit": return r.profit;
  }
}

function buildTimeData(
  records: SummaryRecord[],
  card: AnalysisCard,
): SummaryMainPeriodGroup[] {
  const filtered = records.filter((r) => {
    if (card.storeCodes.length > 0 && !card.storeCodes.includes(r.storeCode)) return false;
    if (card.fiscalYear !== "ALL" && r.fiscalYear !== card.fiscalYear) return false;
    if (card.half !== "ALL" && r.half !== card.half) return false;
    return true;
  });

  const timeline = buildPeriodTimeline(filtered);

  return timeline.map(({ periodKey, periodLabel }) => {
    const [year, half] = periodKey.split("-");
    const periodRecords = filtered.filter(
      (r) => r.fiscalYear === Number(year) && r.half === half,
    );

    const bars = periodRecords.map((r) => ({
      key: `${periodKey}-${r.storeCode}`,
      storeCode: r.storeCode,
      storeName: r.storeName,
      periodKey,
      periodLabel,
      metric: card.metric,
      label: METRIC_LABELS[card.metric],
      value: getMetricValue(r, card.metric),
      color: getStoreColor(r.storeCode),
    }));

    return { periodKey, periodLabel, bars };
  });
}

function buildStoreData(records: SummaryRecord[], card: AnalysisCard) {
  const filtered = records.filter((r) => {
    if (card.storeCodes.length > 0 && !card.storeCodes.includes(r.storeCode)) return false;
    if (card.fiscalYear !== "ALL" && r.fiscalYear !== card.fiscalYear) return false;
    if (card.half !== "ALL" && r.half !== card.half) return false;
    return true;
  });

  const storeMap = new Map<string, { name: string; value: number }>();
  filtered.forEach((r) => {
    const entry = storeMap.get(r.storeCode) ?? { name: r.storeName, value: 0 };
    storeMap.set(r.storeCode, { name: entry.name, value: entry.value + getMetricValue(r, card.metric) });
  });

  return [...storeMap.entries()].map(([code, { name, value }]) => ({
    label: name,
    value,
    color: getStoreColor(code),
  }));
}

function buildLineData(records: SummaryRecord[], card: AnalysisCard) {
  const groups = buildTimeData(records, card);
  // Flatten: one aggregate point per period
  return groups.map((g) => ({
    label: g.periodLabel,
    value: g.bars.reduce((sum, b) => sum + b.value, 0),
  }));
}

type CardProps = {
  card: AnalysisCard;
  records: SummaryRecord[];
  availableStores: Array<{ code: string; name: string }>;
  availableFiscalYears: number[];
  onUpdate: (updated: AnalysisCard) => void;
  onRemove: () => void;
};

function AnalysisCardView({
  card,
  records,
  availableStores,
  availableFiscalYears,
  onUpdate,
  onRemove,
}: CardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const timeData = useMemo(() => buildTimeData(records, card), [records, card]);
  const storeData = useMemo(() => buildStoreData(records, card), [records, card]);
  const lineData = useMemo(() => buildLineData(records, card), [records, card]);

  const allStoreCodes = availableStores.map((s) => s.code as StoreCode);
  const activeStoreCodes = card.storeCodes.length > 0 ? card.storeCodes : allStoreCodes;

  function toggleCardStore(code: StoreCode) {
    const current = card.storeCodes.length > 0 ? card.storeCodes : allStoreCodes;
    const exists = current.includes(code);
    onUpdate({
      ...card,
      storeCodes: exists ? current.filter((c) => c !== code) : [...current, code],
    });
  }

  return (
    <div className="panel rounded-[1.5rem] overflow-hidden">
      {/* Card header */}
      <div className="border-b border-[var(--line)] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          {isEditing ? (
            <input
              className="text-sm font-semibold bg-transparent border-b border-[var(--accent)] outline-none flex-1"
              value={card.title}
              onChange={(e) => onUpdate({ ...card, title: e.target.value })}
              onBlur={() => setIsEditing(false)}
              autoFocus
            />
          ) : (
            <button
              type="button"
              className="text-sm font-semibold text-left hover:text-[var(--accent)] transition"
              onClick={() => setIsEditing(true)}
            >
              {card.title}
            </button>
          )}
          <button
            type="button"
            className="text-xs text-[var(--muted)] hover:text-rose-600 transition px-2 py-1 rounded-lg hover:bg-rose-50"
            onClick={onRemove}
          >
            削除
          </button>
        </div>

        {/* Card controls */}
        <div className="mt-3 flex flex-wrap gap-2">
          {/* Store toggles */}
          {availableStores.map((store) => {
            const active = activeStoreCodes.includes(store.code as StoreCode);
            return (
              <button
                key={store.code}
                type="button"
                onClick={() => toggleCardStore(store.code as StoreCode)}
                className="text-xs rounded-full px-2.5 py-1 border transition"
                style={
                  active
                    ? {
                        background: getStoreColor(store.code),
                        borderColor: getStoreColor(store.code),
                        color: "white",
                      }
                    : {
                        background: "white",
                        borderColor: "var(--line)",
                        color: "var(--muted)",
                      }
                }
              >
                {store.name}
              </button>
            );
          })}

          <select
            className="text-xs rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-[var(--ink)]"
            value={card.fiscalYear}
            onChange={(e) =>
              onUpdate({
                ...card,
                fiscalYear: e.target.value === "ALL" ? "ALL" : Number(e.target.value),
              })
            }
          >
            <option value="ALL">全期間</option>
            {availableFiscalYears.map((y) => (
              <option key={y} value={y}>{y}年度</option>
            ))}
          </select>

          <select
            className="text-xs rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-[var(--ink)]"
            value={card.half}
            onChange={(e) => onUpdate({ ...card, half: e.target.value as Half | "ALL" })}
          >
            <option value="ALL">通期</option>
            <option value="H1">上期</option>
            <option value="H2">下期</option>
          </select>

          <select
            className="text-xs rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-[var(--ink)]"
            value={card.metric}
            onChange={(e) => onUpdate({ ...card, metric: e.target.value as MetricType })}
          >
            <option value="profit">利益</option>
            <option value="salesTotal">売上</option>
            <option value="expenseTotal">経費</option>
          </select>

          <div className="flex rounded-full border border-[var(--line)] overflow-hidden">
            {(["time", "store"] as const).map((by) => (
              <button
                key={by}
                type="button"
                onClick={() => onUpdate({ ...card, compareBy: by })}
                className={`text-xs px-2.5 py-1 transition ${
                  card.compareBy === by
                    ? "bg-[var(--ink)] text-white"
                    : "bg-white text-[var(--muted)]"
                }`}
              >
                {by === "time" ? "時系列" : "店舗比較"}
              </button>
            ))}
          </div>

          {card.compareBy === "time" && (
            <div className="flex rounded-full border border-[var(--line)] overflow-hidden">
              {(["bar", "line"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onUpdate({ ...card, chartType: t })}
                  className={`text-xs px-2.5 py-1 transition ${
                    card.chartType === t
                      ? "bg-[var(--ink)] text-white"
                      : "bg-white text-[var(--muted)]"
                  }`}
                >
                  {t === "bar" ? "棒" : "折線"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        {card.compareBy === "time" && card.chartType === "bar" && (
          <GroupedBarChart
            groups={timeData}
            breakdownMode="none"
            onSelect={() => {}}
            height={280}
          />
        )}
        {card.compareBy === "time" && card.chartType === "line" && (
          <LineChartVisx
            data={lineData}
            color={METRIC_COLORS[card.metric]}
            height={280}
          />
        )}
        {card.compareBy === "store" && (
          <div className="space-y-2">
            {storeData.length === 0 ? (
              <p className="text-sm text-[var(--muted)] py-8 text-center">データなし</p>
            ) : (
              storeData.map((d) => {
                const max = Math.max(...storeData.map((s) => s.value), 1);
                return (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-16 shrink-0 text-right">{d.label}</span>
                    <div className="flex-1 rounded-full bg-black/5 h-5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(d.value / max) * 100}%`,
                          background: d.color,
                          opacity: 0.85,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-[var(--muted)] w-20 text-right shrink-0">
                      {formatCompactCurrency(d.value)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type Props = {
  records: SummaryRecord[];
  availableStores: Array<{ code: string; name: string }>;
  availableFiscalYears: number[];
};

let nextId = 1;

export function AnalysisCardsArea({ records, availableStores, availableFiscalYears }: Props) {
  const [cards, setCards] = useState<AnalysisCard[]>([]);

  function addCard() {
    const id = String(nextId++);
    setCards((current) => [
      ...current,
      {
        id,
        title: `分析カード ${id}`,
        storeCodes: [],
        fiscalYear: "ALL",
        half: "ALL",
        metric: "profit",
        compareBy: "time",
        chartType: "bar",
      },
    ]);
  }

  function updateCard(id: string, updated: AnalysisCard) {
    setCards((current) => current.map((c) => (c.id === id ? updated : c)));
  }

  function removeCard(id: string) {
    setCards((current) => current.filter((c) => c.id !== id));
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide">追加分析</h2>
        <button type="button" className="primary-action text-sm" onClick={addCard}>
          + カード追加
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/40 p-8 text-center text-sm text-[var(--muted)]">
          「カード追加」で任意条件の比較グラフを並列表示できます
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {cards.map((card) => (
            <AnalysisCardView
              key={card.id}
              card={card}
              records={records}
              availableStores={availableStores}
              availableFiscalYears={availableFiscalYears}
              onUpdate={(updated) => updateCard(card.id, updated)}
              onRemove={() => removeCard(card.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
