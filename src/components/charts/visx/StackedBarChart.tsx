"use client";

import { useMemo, useRef, useState } from "react";
import { Group } from "@visx/group";
import { Bar } from "@visx/shape";
import { GridRows } from "@visx/grid";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { scaleBand, scaleLinear } from "@visx/scale";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { ParentSize } from "@visx/responsive";

import { formatCompactCurrency, formatCurrency } from "@/src/lib/format/finance";
import type { CategoryPeriodGroup, CategorySegment, StoreCategoryBar } from "@/src/features/summary/types";

const MARGIN = { top: 16, right: 16, bottom: 60, left: 88 };

type TooltipData = {
  storeName: string;
  periodLabel: string;
  segment: CategorySegment;
  totalAmount: number;
  totalLabel?: string;
};

type InnerProps = {
  width: number;
  height: number;
  groups: CategoryPeriodGroup[];
  onStoreClick?: (storeCode: string, periodKey: string) => void;
  showTotalFrame?: boolean;
};

function StackedBarChartInner({
  width,
  height,
  groups,
  onStoreClick,
  showTotalFrame = false,
}: InnerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop, tooltipOpen } =
    useTooltip<TooltipData>();

  const innerWidth = Math.max(width - MARGIN.left - MARGIN.right, 0);
  const innerHeight = Math.max(height - MARGIN.top - MARGIN.bottom, 0);

  // Outer band: periods
  const periodScale = useMemo(
    () =>
      scaleBand<string>({
        domain: groups.map((g) => g.periodKey),
        range: [0, innerWidth],
        padding: 0.22,
      }),
    [groups, innerWidth],
  );

  // All store codes across all groups (for consistent inner band)
  const allStoreCodes = useMemo(() => {
    const seen = new Set<string>();
    groups.forEach((g) => g.stores.forEach((s) => seen.add(s.storeCode)));
    return [...seen];
  }, [groups]);

  // Inner band: stores within each period
  const storeScale = useMemo(
    () =>
      scaleBand<string>({
        domain: allStoreCodes,
        range: [0, periodScale.bandwidth()],
        padding: 0.08,
      }),
    [allStoreCodes, periodScale],
  );

  const maxValue = useMemo(
    () => Math.max(...groups.flatMap((g) => g.stores.map((s) => s.totalAmount)), 1),
    [groups],
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
                {group.stores.map((storeBar: StoreCategoryBar) => {
                  const barX = storeScale(storeBar.storeCode) ?? 0;
                  const barWidth = storeScale.bandwidth();
                  const barKey = `${group.periodKey}-${storeBar.storeCode}`;
                  const isHovered = hoveredKey === barKey;
                  const totalTop = yScale(storeBar.totalAmount) ?? innerHeight;
                  const totalHeight = Math.max(innerHeight - totalTop, 1);

                  // Stack segments bottom-to-top
                  let cumAmount = 0;
                  return (
                    <Group key={storeBar.storeCode}>
                      {showTotalFrame ? (
                        <>
                          <Bar
                            x={barX}
                            y={totalTop}
                            width={barWidth}
                            height={totalHeight}
                            fill="rgba(14,116,144,0.06)"
                            stroke="rgba(14,116,144,0.32)"
                            strokeWidth={1.2}
                            rx={4}
                          />
                          <text
                            x={barX + barWidth / 2}
                            y={Math.max(totalTop - 6, 10)}
                            textAnchor="middle"
                            fontSize={9}
                            fill="#0e7490"
                          >
                            売上
                          </text>
                        </>
                      ) : null}

                      {storeBar.segments.map((seg) => {
                        const segBottom = yScale(cumAmount) ?? innerHeight;
                        const segTop = yScale(cumAmount + seg.amount) ?? innerHeight;
                        const segHeight = Math.max(segBottom - segTop, 1);
                        cumAmount += seg.amount;

                        return (
                          <Bar
                            key={seg.categoryCode}
                            x={barX}
                            y={segTop}
                            width={barWidth}
                            height={segHeight}
                            fill={seg.color}
                            fillOpacity={isHovered ? 0.95 : tooltipOpen ? 0.6 : 0.82}
                            style={{ cursor: "pointer", transition: "fill-opacity 0.12s" }}
                            onMouseMove={(event) => {
                              const point = localPoint(event) ?? { x: 0, y: 0 };
                              setHoveredKey(barKey);
                              showTooltip({
                                tooltipData: {
                                  storeName: storeBar.storeName,
                                  periodLabel: storeBar.periodLabel,
                                  segment: seg,
                                  totalAmount: storeBar.totalAmount,
                                  totalLabel: storeBar.totalLabel,
                                },
                                tooltipLeft: point.x + MARGIN.left,
                                tooltipTop: point.y + MARGIN.top,
                              });
                            }}
                            onMouseLeave={() => {
                              setHoveredKey(null);
                              hideTooltip();
                            }}
                            onClick={() => onStoreClick?.(storeBar.storeCode, group.periodKey)}
                          />
                        );
                      })}

                      {/* Store label under bars */}
                      <text
                        x={barX + barWidth / 2}
                        y={innerHeight + 16}
                        textAnchor="middle"
                        fontSize={9}
                        fill="#5f6d7b"
                      >
                        {storeBar.storeName.length > 4
                          ? storeBar.storeName.slice(0, 4)
                          : storeBar.storeName}
                      </text>
                    </Group>
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
              dy: "2.2em",
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
          <p style={{ fontWeight: 700, marginBottom: 2 }}>{tooltipData.storeName}</p>
          <p style={{ opacity: 0.75 }}>{tooltipData.periodLabel}</p>
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 2,
                background: tooltipData.segment.color,
              }}
            />
            <span>{tooltipData.segment.categoryName}</span>
          </div>
          <p style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>
            {formatCurrency(tooltipData.segment.amount)}
          </p>
          {tooltipData.totalAmount > 0 && (
            <p style={{ opacity: 0.65, fontSize: 11, marginTop: 2 }}>
              構成比 {((tooltipData.segment.amount / tooltipData.totalAmount) * 100).toFixed(1)}%
              ／ {tooltipData.totalLabel ?? "合計"} {formatCompactCurrency(tooltipData.totalAmount)}
            </p>
          )}
        </TooltipWithBounds>
      )}
    </div>
  );
}

type Props = {
  groups: CategoryPeriodGroup[];
  onStoreClick?: (storeCode: string, periodKey: string) => void;
  height?: number;
  showTotalFrame?: boolean;
};

export function StackedBarChart({
  groups,
  onStoreClick,
  height = 400,
  showTotalFrame = false,
}: Props) {
  if (groups.length === 0 || groups.every((g) => g.stores.length === 0)) {
    return (
      <div
        className="flex items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/60 p-8 text-sm text-[var(--muted)]"
        style={{ height }}
      >
        カテゴリデータがありません
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ParentSize>
        {({ width }) => (
          <StackedBarChartInner
            width={width}
            height={height}
            groups={groups}
            onStoreClick={onStoreClick}
            showTotalFrame={showTotalFrame}
          />
        )}
      </ParentSize>
    </div>
  );
}
