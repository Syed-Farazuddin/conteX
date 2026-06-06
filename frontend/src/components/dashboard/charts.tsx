"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface SeriesPoint {
  date: string;
  value: number;
}

const AXIS = "#71717a"; // zinc-500
const GRID = "rgba(255,255,255,0.06)";

function tooltipStyle() {
  return {
    contentStyle: {
      background: "#16131f",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 12,
      fontSize: 12,
      color: "#f4f4f5",
    },
    labelStyle: { color: "#a1a1aa" },
  };
}

function shortDate(d: string) {
  // "2026-06-01" -> "Jun 1"
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TrendChart({
  data,
  color = "#8b5cf6",
  height = 240,
}: {
  data: SeriesPoint[];
  color?: string;
  height?: number;
}) {
  const gradientId = `grad-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          tick={{ fill: AXIS, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: AXIS, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={48}
          allowDecimals={false}
        />
        <Tooltip
          {...tooltipStyle()}
          labelFormatter={(label) => shortDate(String(label))}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarSeries({
  data,
  color = "#8b5cf6",
  height = 240,
}: {
  data: Array<{ label: string; value: number }>;
  color?: string;
  height?: number;
}) {
  const palette = ["#8b5cf6", "#6366f1", "#a855f7", "#ec4899", "#22d3ee"];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: AXIS, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: AXIS, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={48}
          allowDecimals={false}
        />
        <Tooltip {...tooltipStyle()} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={color}>
          {data.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
