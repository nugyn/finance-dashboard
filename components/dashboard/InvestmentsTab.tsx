"use client";

import { useState } from "react";
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
import type { MonthlySnapshot, Holding } from "@prisma/client";

interface Props {
  snapshots: MonthlySnapshot[];
  holdings: Holding[];
}

type AssetTab = "etf" | "stock" | "crypto" | "managed_fund";

const COLORS = ["#818cf8", "#34d399", "#fb923c", "#60a5fa", "#a78bfa", "#f472b6"];

const ETF_CHART_DATA_KEY: Record<AssetTab, keyof MonthlySnapshot> = {
  etf: "etfValue",
  stock: "sharesValue",
  crypto: "cryptoValue",
  managed_fund: "mfValue",
};

const TAB_LABELS: Record<AssetTab, string> = {
  etf: "ETFs",
  stock: "Stocks",
  crypto: "Crypto",
  managed_fund: "Managed Funds",
};

export default function InvestmentsTab({ snapshots, holdings }: Props) {
  const [activeAsset, setActiveAsset] = useState<AssetTab>("etf");

  const assetHoldings = holdings.filter((h) => h.assetClass === activeAsset);
  const totalValue = assetHoldings.reduce((s, h) => s + h.currentValue, 0);
  const totalReturn = assetHoldings.reduce((s, h) => s + h.totalReturn, 0);

  const chartKey = ETF_CHART_DATA_KEY[activeAsset];
  const chartData = snapshots.map((s) => ({
    date: fmtDate(s.date),
    value: Number(s[chartKey]) || 0,
  }));

  const allocationData = assetHoldings
    .filter((h) => h.currentValue > 0)
    .map((h) => ({ name: h.ticker, value: h.currentValue, target: h.targetAlloc }));

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-700">
        {(Object.entries(TAB_LABELS) as [AssetTab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveAsset(key)}
            className={`px-3 py-2 text-sm transition-colors ${
              activeAsset === key
                ? "text-indigo-400 border-b-2 border-indigo-400 -mb-px"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">{TAB_LABELS[activeAsset]} Value</div>
          <div className="text-xl font-mono font-bold text-indigo-400">{fmt(totalValue)}</div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Total Return</div>
          <div
            className={`text-xl font-mono font-bold ${
              totalReturn >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {fmt(totalReturn)}
          </div>
        </div>
      </div>

      {/* Holdings table */}
      {assetHoldings.length > 0 ? (
        <div className="bg-gray-800/60 rounded-lg border border-gray-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3 text-xs text-gray-500 font-medium">Ticker</th>
                <th className="text-right p-3 text-xs text-gray-500 font-medium">Units</th>
                <th className="text-right p-3 text-xs text-gray-500 font-medium">Ave Price</th>
                <th className="text-right p-3 text-xs text-gray-500 font-medium">Value</th>
                <th className="text-right p-3 text-xs text-gray-500 font-medium">Return %</th>
                <th className="text-right p-3 text-xs text-gray-500 font-medium">Target</th>
              </tr>
            </thead>
            <tbody>
              {assetHoldings.map((h) => (
                <tr key={h.id} className="border-b border-gray-700/50">
                  <td className="p-3">
                    <div className="text-gray-100 font-medium">{h.ticker}</div>
                    {h.name && <div className="text-xs text-gray-500">{h.name}</div>}
                  </td>
                  <td className="p-3 text-right font-mono text-gray-300">{h.heldUnits}</td>
                  <td className="p-3 text-right font-mono text-gray-300">
                    ${h.avePrice.toFixed(3)}
                  </td>
                  <td className="p-3 text-right font-mono text-gray-100">{fmt(h.currentValue)}</td>
                  <td
                    className={`p-3 text-right font-mono ${
                      h.returnPct >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {fmtPct(h.returnPct)}
                  </td>
                  <td className="p-3 text-right font-mono text-gray-400">
                    {h.targetAlloc > 0 ? fmtPct(h.targetAlloc) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No {TAB_LABELS[activeAsset]} holdings imported.</div>
      )}

      {/* Historical value chart */}
      {chartData.some((d) => d.value > 0) && (
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
            {TAB_LABELS[activeAsset]} History
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <YAxis
                  tick={{ fill: "#9ca3af", fontSize: 10 }}
                  tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: 6,
                    fontSize: 11,
                  }}
                  formatter={(v) => [fmt(Number(v))]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fill="url(#invGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Allocation donut */}
      {allocationData.length > 1 && (
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
            Allocation
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ""
                  }
                  labelLine={false}
                >
                  {allocationData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "#d1d5db", fontSize: 11 }}>{value}</span>
                  )}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: 6,
                    fontSize: 11,
                  }}
                  formatter={(v) => [fmt(Number(v))]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
