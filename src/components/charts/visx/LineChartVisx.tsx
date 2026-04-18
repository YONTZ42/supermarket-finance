"use client";

import { useMemo, useRef } from "react";
import { Group } from "@visx/group";
import { LinePath } from "@visx/shape";
import { GridRows } from "@visx/grid";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { scaleBand, scaleLinear } from "@visx/scale";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { ParentSize } from "@visx/responsive";

import { formatCompactCurrency, formatCurrency } from "@/src/lib/format/finance";
import type { LineChartPoint } from "@/src/types/chart";

const MARGIN = { top: 16, right: 16, bottom: 52, left: 80 };

type TooltipData = { point: LineChartPoint; x: number; y: number };

type InnerProps = {
  width: number;
  height: number;
  data: LineChartPoint[];
  yLabel: string;
  color?: string;
};

function LineChartInner({ width, height, data, yLabel, color = "#0e7490" }: InnerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop, tooltipOpen } =
    useTooltip<TooltipData>();

  const innerWidth = Math.max(width - MARGIN.left - MARGIN.right, 0);
  const innerHeight = Math.max(height - MARGIN.top - MARGIN.bottom, 0);

  const xScale = useMemo(
    () =>
      scaleBand<string>({
        domain: data.map((d) => d.label),
        range: [0, innerWidth],
        padding: 0.1,
      }),
    [data, innerWidth],
  );

  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);
  const minValue = useMemo(() => Math.min(...data.map((d) => d.value), 0), [data]);

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [Math.min(minValue * 0.9, 0), maxValue * 1.12],
        range: [innerHeight, 0],
        nice: true,
      }),
    [minValue, maxValue, innerHeight],
  );

  const getX = (d: LineChartPoint) => (xScale(d.label) ?? 0) + xScale.bandwidth() / 2;
  const getY = (d: LineChartPoint) => yScale(d.value) ?? 0;

  if (width < 10) return null;

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef} width={width} height={height}>
        <defs>
          <linearGradient id="line-area-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Group left={MARGIN.left} top={MARGIN.top}>
          <GridRows
            scale={yScale}
            width={innerWidth}
            stroke="rgba(24,34,47,0.06)"
            strokeDasharray="4,3"
            numTicks={5}
          />

          {/* Area fill */}
          <path
            d={
              data.length >= 2
                ? [
                    `M ${getX(data[0])} ${innerHeight}`,
                    `L ${getX(data[0])} ${getY(data[0])}`,
                    ...data.slice(1).map((d) => `L ${getX(d)} ${getY(d)}`),
                    `L ${getX(data[data.length - 1])} ${innerHeight}`,
                    "Z",
                  ].join(" ")
                : ""
            }
            fill="url(#line-area-fill)"
          />

          {/* Line */}
          <LinePath
            data={data}
            x={getX}
            y={getY}
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots */}
          {data.map((d) => (
            <circle
              key={d.label}
              cx={getX(d)}
              cy={getY(d)}
              r={tooltipData?.point.label === d.label ? 5.5 : 4}
              fill="white"
              stroke={color}
              strokeWidth={2}
              style={{ cursor: "pointer", transition: "r 0.1s" }}
              onMouseMove={(event) => {
                const point = localPoint(event) ?? { x: 0, y: 0 };
                showTooltip({
                  tooltipData: { point: d, x: point.x, y: point.y },
                  tooltipLeft: point.x + MARGIN.left,
                  tooltipTop: point.y + MARGIN.top,
                });
              }}
              onMouseLeave={() => hideTooltip()}
            />
          ))}

          {/* Axes */}
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
            scale={xScale}
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
          <p style={{ opacity: 0.75, marginBottom: 2 }}>{tooltipData.point.label}</p>
          <p style={{ fontWeight: 700, fontSize: 15 }}>{formatCurrency(tooltipData.point.value)}</p>
        </TooltipWithBounds>
      )}
    </div>
  );
}

type Props = {
  data: LineChartPoint[];
  yLabel?: string;
  color?: string;
  height?: number;
};

export function LineChartVisx({ data, yLabel = "", color = "#0e7490", height = 260 }: Props) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/60 p-8 text-sm text-[var(--muted)]"
        style={{ height }}
      >
        {yLabel} のデータがありません
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ParentSize>
        {({ width }) => (
          <LineChartInner
            width={width}
            height={height}
            data={data}
            yLabel={yLabel}
            color={color}
          />
        )}
      </ParentSize>
    </div>
  );
}
