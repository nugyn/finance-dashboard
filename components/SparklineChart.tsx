"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from "recharts";

interface DataPoint {
  value: number;
  fetchedAt: string;
}

interface Props {
  data: DataPoint[];
  color?: string;
  label: string;
  unit?: string | null;
}

export default function SparklineChart({ data, color = "#818cf8", label, unit }: Props) {
  if (data.length < 2) {
    return (
      <div className="h-16 flex items-center justify-center text-xs text-gray-600">
        Need 2+ snapshots
      </div>
    );
  }

  const chartData = [...data].reverse().map((d) => ({
    value: d.value,
    date: new Date(d.fetchedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
  }));

  return (
    <div className="h-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={["auto", "auto"]} hide />
          <Tooltip
            contentStyle={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: 6,
              fontSize: 11,
            }}
            labelStyle={{ color: "#9ca3af", marginBottom: 2 }}
            itemStyle={{ color }}
            formatter={(v) =>
              unit === "$"
                ? [`$${Number(v).toLocaleString("en-AU")}`, label]
                : [`${v}${unit ?? ""}`, label]
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
