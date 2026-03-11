"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface DataPoint {
  value: number;
  signal: string;
  fetchedAt: string;
}

interface Props {
  data: DataPoint[];
  color: string;
  label: string;
  unit?: string | null;
}

export default function TrendChart({ data, color, label, unit }: Props) {
  if (data.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-gray-600">
        Need 2+ snapshots to show trend
      </div>
    );
  }

  const chartData = [...data].reverse().map((d) => ({
    value: d.value,
    signal: d.signal,
    date: new Date(d.fetchedAt).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
    }),
  }));

  function formatVal(v: number): string {
    if (unit === "$") {
      return v >= 1000000
        ? `$${(v / 1000000).toFixed(2)}M`
        : `$${Math.round(v).toLocaleString("en-AU")}`;
    }
    if (unit === "%") return `${v.toFixed(2)}%`;
    return v.toLocaleString("en-AU");
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={{ stroke: "#374151" }}
            tickLine={false}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={{ stroke: "#374151" }}
            tickLine={false}
            tickFormatter={(v) => formatVal(v)}
            width={70}
          />
          <Tooltip
            contentStyle={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: 6,
              fontSize: 12,
            }}
            labelStyle={{ color: "#9ca3af", marginBottom: 4 }}
            itemStyle={{ color }}
            formatter={(v) => [formatVal(Number(v)), label]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${label})`}
            dot={{ r: 3, fill: color, stroke: color }}
            activeDot={{ r: 5, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
