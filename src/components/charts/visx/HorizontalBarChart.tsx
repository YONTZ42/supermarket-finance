"use client";

import { useMemo, useRef } from "react";
import { Group } from "@visx/group";
import { Bar } from "@visx/shape";
import { GridColumns } from "@visx/grid";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { scaleBand, scaleLinear } from "@visx/scale";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { ParentSize } from "@visx/responsive";

import { formatCompactCurrency, formatCurrency } from "@/src/lib/format/finance";
import type { ChartPoint } from "@/src/types/chart";

const MARGIN = { top: 12, right: 60, bottom: 44, left: 120 };
const DEFAULT_COLOR = "#0e7490";

type InnerProps = {
  width: number;
  height: number;
  data: ChartPoint[];
  yLabel: string;
};

function HorizontalBarChartInner({ width, height, data, yLabel }: InnerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop, tooltipOpen } =
    useTooltip<ChartPoint>();

  const innerWidth = Math.max(width - MARGIN.left - MARGIN.right, 0);
  const innerHeight = Math.max(height - MARGIN.top - MARGIN.bottom, 0);

  const yScale = useMemo(
    () =>
      scaleBand<string>({
        domain: data.map((d) => d.label),
        range: [0, innerHeight],
        padding: 0.28,
      }),
    [data, innerHeight],
  );

  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  const xScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, maxValue * 1.12],
        range: [0, innerWidth],
        nice: true,
      }),
    [maxValue, innerWidth],
  );

  if (width < 10) return null;

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef} width={width} height={height}>
        <Group left={MARGIN.left} top={MARGIN.top}>
          <GridColumns
            scale={xScale}
            height={innerHeight}
            stroke="rgba(24,34,47,0.06)"
            strokeDasharray="4,3"
            numTicks={4}
          />

          {data.map((d) => {
            const barY = yScale(d.label) ?? 0;
            const barH = yScale.bandwidth();
            const barW = Math.max(xScale(d.value) ?? 0, 2);
            const color = d.color ?? DEFAULT_COLOR;
            const isHovered = tooltipData?.label === d.label;

            return (
              <Group key={d.label}>
                <Bar
                  x={0}
                  y={barY}
                  width={barW}
                  height={barH}
                  fill={color}
                  fillOpacity={isHovered ? 0.95 : tooltipOpen ? 0.6 : 0.82}
                  rx={barH < 10 ? 2 : 5}
                  style={{ cursor: "pointer", transition: "fill-opacity 0.12s" }}
                  onMouseMove={(event) => {
                    const point = localPoint(event) ?? { x: 0, y: 0 };
                    showTooltip({
                      tooltipData: d,
                      tooltipLeft: point.x + MARGIN.left,
                      tooltipTop: point.y + MARGIN.top,
                    });
                  }}
                  onMouseLeave={() => hideTooltip()}
                />
                {/* Value label */}
                <text
                  x={barW + 6}
                  y={barY + barH / 2}
                  dominantBaseline="middle"
                  fontSize={10}
                  fill="#5f6d7b"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {formatCompactCurrency(d.value)}
                </text>
              </Group>
            );
          })}

          <AxisLeft
            scale={yScale}
            stroke="rgba(24,34,47,0.12)"
            tickStroke="transparent"
            tickLabelProps={() => ({
              fill: "#18222f",
              fontSize: 11,
              textAnchor: "end",
              dx: -8,
              dy: "0.32em",
            })}
          />
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            numTicks={4}
            tickFormat={(v) => formatCompactCurrency(Number(v))}
            stroke="rgba(24,34,47,0.12)"
            tickStroke="transparent"
            tickLabelProps={() => ({
              fill: "#5f6d7b",
              fontSize: 10,
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
          <p style={{ fontWeight: 600, marginBottom: 2 }}>{tooltipData.label}</p>
          <p style={{ fontWeight: 700, fontSize: 14 }}>{formatCurrency(tooltipData.value)}</p>
          {maxValue > 0 && (
            <p style={{ opacity: 0.65, fontSize: 11, marginTop: 2 }}>
              {((tooltipData.value / maxValue) * 100).toFixed(1)}%
            </p>
          )}
        </TooltipWithBounds>
      )}
    </div>
  );
}

type Props = {
  data: ChartPoint[];
  yLabel?: string;
  height?: number;
};

export function HorizontalBarChart({ data, yLabel = "", height = 260 }: Props) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/60 p-8 text-sm text-[var(--muted)]"
        style={{ height }}
      >
        {yLabel ? `${yLabel} の` : ""}データがありません
      </div>
    );
  }

  const chartHeight = Math.max(height, data.length * 44 + 60);

  return (
    <div style={{ height: chartHeight }}>
      <ParentSize>
        {({ width }) => (
          <HorizontalBarChartInner
            width={width}
            height={chartHeight}
            data={data}
            yLabel={yLabel}
          />
        )}
      </ParentSize>
    </div>
  );
}
