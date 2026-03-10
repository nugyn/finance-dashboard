"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fmt, fmtDate } from "@/lib/formatters";
import type { MonthlySnapshot } from "@prisma/client";

interface Props {
  snapshots: MonthlySnapshot[];
}

export default function SuperTab({ snapshots }: Props) {
  const latest = snapshots[snapshots.length - 1];
  const first = snapshots[0];

  const totalGrowth = latest.superValue - first.superValue;
  const growthPct = first.superValue > 0 ? totalGrowth / first.superValue : 0;
  const ytdContrib = snapshots
    .filter((s) => new Date(s.date).getFullYear() === new Date(latest.date).getFullYear())
    .reduce((sum, s) => sum + s.superVolContrib, 0);

  const chartData = snapshots.map((s) => ({
    date: fmtDate(s.date),
    value: s.superValue,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Balance</div>
          <div className="text-xl font-mono font-bold text-orange-400">{fmt(latest.superValue)}</div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">YTD Vol. Contrib.</div>
          <div className="text-xl font-mono font-bold text-indigo-400">{fmt(ytdContrib)}</div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Growth (tracked)</div>
          <div
            className={`text-xl font-mono font-bold ${
              totalGrowth >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {fmt(totalGrowth)} ({(growthPct * 100).toFixed(1)}%)
          </div>
        </div>
      </div>

      <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
          Super Balance History
        </h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="superGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(v) => [fmt(Number(v)), "Super Balance"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#fb923c"
                strokeWidth={2}
                fill="url(#superGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
