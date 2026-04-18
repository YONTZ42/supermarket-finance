"use client";

import { useMemo, useRef } from "react";
import { Group } from "@visx/group";
import { Bar } from "@visx/shape";
import { GridRows } from "@visx/grid";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { scaleBand, scaleLinear } from "@visx/scale";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { ParentSize } from "@visx/responsive";

import { formatCompactCurrency, formatCurrency } from "@/src/lib/format/finance";
import type {
  SummaryBreakdownMode,
  SummaryMainBarDatum,
  SummaryMainPeriodGroup,
  SummaryMainSelection,
} from "@/src/features/summary/types";

const MARGIN = { top: 16, right: 16, bottom: 56, left: 88 };

type TooltipData = SummaryMainBarDatum;

type InnerProps = {
  width: number;
  height: number;
  groups: SummaryMainPeriodGroup[];
  breakdownMode: SummaryBreakdownMode;
  onSelect: (selection: SummaryMainSelection) => void;
  selectedKey: string | null;
};

function getBarInnerKey(bar: SummaryMainBarDatum, mode: SummaryBreakdownMode): string {
  if (mode === "pl") return `${bar.storeCode}-${bar.metric}`;
  return bar.storeCode;
}

function GroupedBarChartInner({
  width,
  height,
  groups,
  breakdownMode,
  onSelect,
  selectedKey,
}: InnerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop, tooltipOpen } =
    useTooltip<TooltipData>();

  const innerWidth = Math.max(width - MARGIN.left - MARGIN.right, 0);
  const innerHeight = Math.max(height - MARGIN.top - MARGIN.bottom, 0);

  const innerKeys = useMemo(() => {
    const seen = new Set<string>();
    groups.forEach((g) => {
      g.bars.forEach((b) => seen.add(getBarInnerKey(b, breakdownMode)));
    });
    return [...seen];
  }, [groups, breakdownMode]);

  const maxValue = useMemo(
    () => Math.max(...groups.flatMap((g) => g.bars.map((b) => b.value)), 1),
    [groups],
  );

  const periodScale = useMemo(
    () =>
      scaleBand<string>({
        domain: groups.map((g) => g.periodKey),
        range: [0, innerWidth],
        padding: 0.22,
      }),
    [groups, innerWidth],
  );

  const innerScale = useMemo(
    () =>
      scaleBand<string>({
        domain: innerKeys,
        range: [0, periodScale.bandwidth()],
        padding: 0.06,
      }),
    [innerKeys, periodScale],
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, maxValue * 1.12],
        range: [innerHeight, 0],
        nice: true,
      }),
    [maxValue, innerHeight],
  );

  if (width < 10) return null;

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef} width={width} height={height}>
        <Group left={MARGIN.left} top={MARGIN.top}>
          <GridRows
            scale={yScale}
            width={innerWidth}
            stroke="rgba(24,34,47,0.06)"
            strokeDasharray="4,3"
            numTicks={5}
          />

          {groups.map((group) => {
            const groupX = periodScale(group.periodKey) ?? 0;
            return (
              <Group key={group.periodKey} left={groupX}>
                {group.bars.map((bar) => {
                  const innerKey = getBarInnerKey(bar, breakdownMode);
                  const barX = innerScale(innerKey) ?? 0;
                  const barWidth = innerScale.bandwidth();
                  const barY = yScale(bar.value) ?? 0;
                  const barH = Math.max(innerHeight - barY, 1);
                  const isSelected = selectedKey === bar.key;
                  const isHovered = tooltipData?.key === bar.key;

                  return (
                    <Bar
                      key={bar.key}
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barH}
                      fill={bar.color}
                      fillOpacity={isSelected ? 1 : isHovered ? 0.95 : tooltipOpen ? 0.55 : 0.82}
                      rx={barWidth < 10 ? 2 : 5}
                      style={{ cursor: "pointer", transition: "fill-opacity 0.12s" }}
                      onMouseMove={(event) => {
                        const point = localPoint(event) ?? { x: 0, y: 0 };
                        showTooltip({
                          tooltipData: bar,
                          tooltipLeft: point.x + MARGIN.left,
                          tooltipTop: point.y + MARGIN.top,
                        });
                      }}
                      onMouseLeave={() => hideTooltip()}
                      onClick={() =>
                        onSelect({
                          storeCode: bar.storeCode,
                          periodKey: bar.periodKey,
                          metric: bar.metric,
                          label: bar.label,
                        })
                      }
                    />
                  );
                })}
              </Group>
            );
          })}

          <AxisLeft
            scale={yScale}
            numTicks={5}
            tickFormat={(v) => formatCompactCurrency(Number(v))}
            stroke="rgba(24,34,47,0.12)"
            tickStroke="transparent"
            tickLabelProps={() => ({
              fill: "#5f6d7b",
              fontSize: 11,
              textAnchor: "end",
              dx: -6,
              dy: "0.32em",
            })}
          />
          <AxisBottom
            top={innerHeight}
            scale={periodScale}
            stroke="rgba(24,34,47,0.12)"
            tickStroke="transparent"
            tickLabelProps={() => ({
              fill: "#5f6d7b",
              fontSize: 11,
              textAnchor: "middle",
              dy: "1em",
            })}
          />
        </Group>
      </svg>

      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          style={{
            background: "#18222f",
            color: "#fff",
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 12,
            lineHeight: "1.7",
            boxShadow: "0 8px 32px rgba(24,34,47,0.32)",
            pointerEvents: "none",
            position: "absolute",
            zIndex: 50,
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: 2, fontSize: 13 }}>{tooltipData.storeName}</p>
          <p style={{ opacity: 0.75 }}>
            {tooltipData.periodLabel} · {tooltipData.label}
          </p>
          <p style={{ fontWeight: 700, marginTop: 6, fontSize: 15 }}>
            {formatCurrency(tooltipData.value)}
          </p>
          {maxValue > 0 && (
            <p style={{ opacity: 0.65, fontSize: 11, marginTop: 2 }}>
              構成比 {((tooltipData.value / maxValue) * 100).toFixed(1)}%
            </p>
          )}
        </TooltipWithBounds>
      )}
    </div>
  );
}

type Props = {
  groups: SummaryMainPeriodGroup[];
  breakdownMode: SummaryBreakdownMode;
  onSelect: (selection: SummaryMainSelection) => void;
  selectedKey?: string | null;
  height?: number;
};

export function GroupedBarChart({ groups, breakdownMode, onSelect, selectedKey = null, height = 380 }: Props) {
  if (groups.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/60 p-8 text-sm text-[var(--muted)]"
        style={{ height }}
      >
        比較対象データがありません
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ParentSize>
        {({ width }) => (
          <GroupedBarChartInner
            width={width}
            height={height}
            groups={groups}
            breakdownMode={breakdownMode}
            onSelect={onSelect}
            selectedKey={selectedKey}
          />
        )}
      </ParentSize>
    </div>
  );
}
