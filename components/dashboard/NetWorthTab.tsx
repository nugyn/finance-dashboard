"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { fmt, fmtDate } from "@/lib/formatters";
import type { MonthlySnapshot } from "@prisma/client";

interface Props {
  snapshots: MonthlySnapshot[];
}

const CLASS_COLORS: Record<string, string> = {
  etf: "#818cf8",
  cash: "#34d399",
  super: "#fb923c",
  property: "#60a5fa",
  shares: "#a78bfa",
  crypto: "#f472b6",
  mf: "#facc15",
};

export default function NetWorthTab({ snapshots }: Props) {
  if (snapshots.length === 0) {
    return <div className="text-gray-500 text-sm">No snapshot data imported yet.</div>;
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
  const totalLiab = latest.liabilitiesTotal + latest.mortgageBalance;

  const assetRows = [
    { label: "ETFs", value: latest.etfValue, gain: latest.etfGain, key: "etf" },
    { label: "Shares", value: latest.sharesValue, gain: latest.sharesGain, key: "shares" },
    { label: "Crypto", value: latest.cryptoValue, gain: latest.cryptoGain, key: "crypto" },
    { label: "Cash", value: latest.cashValue, gain: latest.cashGain, key: "cash" },
    { label: "Super", value: latest.superValue, gain: latest.superGain, key: "super" },
    { label: "Managed Funds", value: latest.mfValue, gain: latest.mfGain, key: "mf" },
    { label: "Property", value: latest.propertyValue, gain: latest.propertyGain, key: "property" },
    { label: "Other", value: latest.otherValue, gain: latest.otherGain, key: "other" },
  ].filter((r) => r.value > 0 || r.key === "etf");

  // Stacked chart data
  const stackData = snapshots.map((s) => ({
    date: fmtDate(s.date),
    ETFs: s.etfValue,
    Cash: s.cashValue,
    Super: s.superValue,
    Property: s.propertyValue,
    Shares: s.sharesValue,
    Crypto: s.cryptoValue,
  }));

  // NW rolling chart with delta
  const nwData = snapshots.map((s, i) => {
    const assets =
      s.etfValue +
      s.sharesValue +
      s.cryptoValue +
      s.cashValue +
      s.superValue +
      s.mfValue +
      s.otherValue +
      s.propertyValue;
    const nw = assets + s.liabilitiesTotal + s.mortgageBalance;
    const prev = i > 0 ? snapshots[i - 1] : null;
    const prevNw = prev
      ? prev.etfValue +
        prev.sharesValue +
        prev.cryptoValue +
        prev.cashValue +
        prev.superValue +
        prev.mfValue +
        prev.otherValue +
        prev.propertyValue +
        prev.liabilitiesTotal +
        prev.mortgageBalance
      : nw;
    return {
      date: fmtDate(s.date),
      nw: Math.round(nw),
      delta: Math.round(nw - prevNw),
    };
  });

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Total Assets</div>
          <div className="text-xl font-mono font-bold text-indigo-400">{fmt(totalAssets)}</div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Total Liabilities</div>
          <div className="text-xl font-mono font-bold text-red-400">{fmt(totalLiab)}</div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Net Worth</div>
          <div className="text-xl font-mono font-bold text-emerald-400">
            {fmt(totalAssets + totalLiab)}
          </div>
        </div>
      </div>

      {/* Asset breakdown table */}
      <div className="bg-gray-800/60 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-3 text-xs text-gray-500 font-medium">Asset</th>
              <th className="text-right p-3 text-xs text-gray-500 font-medium">Value</th>
              <th className="text-right p-3 text-xs text-gray-500 font-medium">Gain ($)</th>
            </tr>
          </thead>
          <tbody>
            {assetRows.map((r) => (
              <tr key={r.key} className="border-b border-gray-700/50">
                <td className="p-3 text-gray-300 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ background: CLASS_COLORS[r.key] ?? "#6b7280" }}
                  />
                  {r.label}
                </td>
                <td className="p-3 text-right font-mono text-gray-100">{fmt(r.value)}</td>
                <td
                  className={`p-3 text-right font-mono ${
                    r.gain > 0 ? "text-emerald-400" : r.gain < 0 ? "text-red-400" : "text-gray-500"
                  }`}
                >
                  {r.gain !== 0 ? fmt(r.gain) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stacked area chart */}
      <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
          Asset Classes Over Time
        </h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stackData}>
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
              {Object.entries({ ETFs: "#818cf8", Cash: "#34d399", Super: "#fb923c", Property: "#60a5fa" }).map(
                ([key, color]) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId="1"
                    stroke={color}
                    fill={color}
                    fillOpacity={0.6}
                  />
                )
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NW rolling line chart */}
      <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
          Net Worth Progression
        </h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={nwData}>
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
                formatter={(v, name) => [
                  fmt(Number(v)),
                  name === "nw" ? "Net Worth" : "Monthly Δ",
                ]}
              />
              <Line type="monotone" dataKey="nw" stroke="#818cf8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
