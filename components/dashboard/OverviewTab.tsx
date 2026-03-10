"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { fmt, fmtDate, fmtPct } from "@/lib/formatters";
import type { MonthlySnapshot } from "@prisma/client";

interface Props {
  snapshots: MonthlySnapshot[];
}

const ASSET_COLORS: Record<string, string> = {
  ETFs: "#818cf8",
  Cash: "#34d399",
  Super: "#fb923c",
  Property: "#60a5fa",
  Shares: "#a78bfa",
  Crypto: "#f472b6",
  "Managed Funds": "#facc15",
  Other: "#9ca3af",
};

export default function OverviewTab({ snapshots }: Props) {
  if (snapshots.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        No data yet.{" "}
        <button className="text-indigo-400 underline">Import your xlsx</button> to get started.
      </div>
    );
  }

  const latest = snapshots[snapshots.length - 1];

  const totalAssets =
    latest.etfValue +
    latest.sharesValue +
    latest.cryptoValue +
    latest.cashValue +
    latest.superValue +
    latest.mfValue +
    latest.otherValue +
    latest.propertyValue;

  const totalLiabilities = latest.liabilitiesTotal + latest.mortgageBalance;
  const netWorth = totalAssets + totalLiabilities;

  const savingsRate = latest.cashSavingsRate;

  // Net worth chart data
  const chartData = snapshots.map((s) => {
    const assets =
      s.etfValue +
      s.sharesValue +
      s.cryptoValue +
      s.cashValue +
      s.superValue +
      s.mfValue +
      s.otherValue +
      s.propertyValue;
    const liab = s.liabilitiesTotal + s.mortgageBalance;
    return {
      date: fmtDate(s.date),
      netWorth: Math.round(assets + liab),
    };
  });

  // Allocation donut
  const allocation = [
    { name: "Property", value: latest.propertyValue },
    { name: "Super", value: latest.superValue },
    { name: "ETFs", value: latest.etfValue },
    { name: "Cash", value: latest.cashValue },
    { name: "Shares", value: latest.sharesValue },
    { name: "Crypto", value: latest.cryptoValue },
    { name: "Managed Funds", value: latest.mfValue },
    { name: "Other", value: latest.otherValue },
  ].filter((a) => a.value > 0);

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Net Worth", value: fmt(netWorth), color: "text-emerald-400" },
          { label: "Total Assets", value: fmt(totalAssets), color: "text-indigo-400" },
          {
            label: "Total Liabilities",
            value: fmt(totalLiabilities),
            color: "text-red-400",
          },
          {
            label: "Savings Rate",
            value: savingsRate !== 0 ? fmtPct(Math.abs(savingsRate)) : "—",
            color: savingsRate > 0 ? "text-emerald-400" : "text-gray-400",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
            <div className="text-xs text-gray-500 mb-1">{kpi.label}</div>
            <div className={`text-xl font-mono font-bold ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Net Worth chart */}
      <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
          Net Worth History
        </h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
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
                formatter={(v) => [fmt(Number(v)), "Net Worth"]}
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="#818cf8"
                strokeWidth={2}
                fill="url(#nwGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Asset allocation donut */}
      <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
          Asset Allocation
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocation}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ""
                }
                labelLine={false}
              >
                {allocation.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={ASSET_COLORS[entry.name] ?? "#6b7280"}
                  />
                ))}
              </Pie>
              <Legend
                formatter={(value) => (
                  <span style={{ color: "#d1d5db", fontSize: 12 }}>{value}</span>
                )}
              />
              <Tooltip
                contentStyle={{
                  background: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(v) => [fmt(Number(v))]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="text-xs text-gray-600 text-right">
        Last recorded: {fmtDate(latest.date)}
      </div>
    </div>
  );
}
