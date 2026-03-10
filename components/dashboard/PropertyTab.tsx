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
import dynamic from "next/dynamic";

const PropertyCalculator = dynamic(
  () => import("@/components/PropertyCalculator"),
  { ssr: false }
);

interface Props {
  snapshots: MonthlySnapshot[];
}

export default function PropertyTab({ snapshots }: Props) {
  const latest = snapshots[snapshots.length - 1];

  const propertyGainPct =
    latest.propertyPurchase > 0
      ? (latest.propertyValue - latest.propertyPurchase) / latest.propertyPurchase
      : 0;

  const chartData = snapshots.map((s) => ({
    date: fmtDate(s.date),
    value: s.propertyValue,
    equity: s.propertyEquity,
    mortgage: Math.abs(s.mortgageBalance),
  }));

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Current Value</div>
          <div className="text-xl font-mono font-bold text-blue-400">
            {fmt(latest.propertyValue)}
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Purchase Price</div>
          <div className="text-xl font-mono font-bold text-gray-400">
            {fmt(latest.propertyPurchase)}
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Equity</div>
          <div className="text-xl font-mono font-bold text-emerald-400">
            {fmt(latest.propertyEquity)}
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Capital Gain</div>
          <div
            className={`text-xl font-mono font-bold ${
              latest.propertyGain >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {fmt(latest.propertyGain)}
            <span className="text-sm ml-1 font-normal text-gray-400">
              ({(propertyGainPct * 100).toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Property value history */}
      <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
          Property Value History
        </h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="propGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
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
                stroke="#60a5fa"
                strokeWidth={2}
                fill="url(#propGrad)"
                name="Property Value"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Equity and mortgage paydown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
            Equity Growth
          </h3>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 9 }} />
                <YAxis
                  tick={{ fill: "#9ca3af", fontSize: 9 }}
                  tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 6, fontSize: 11 }}
                  formatter={(v) => [fmt(Number(v))]}
                />
                <Area type="monotone" dataKey="equity" stroke="#34d399" strokeWidth={2} fill="#34d39920" name="Equity" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
            Mortgage Paydown
          </h3>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 9 }} />
                <YAxis
                  tick={{ fill: "#9ca3af", fontSize: 9 }}
                  tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 6, fontSize: 11 }}
                  formatter={(v) => [fmt(Number(v))]}
                />
                <Line type="monotone" dataKey="mortgage" stroke="#f87171" strokeWidth={2} dot={false} name="Mortgage Balance" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Embedded property calculator */}
      <div className="border-t border-gray-700 pt-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
          What-If Calculator
        </h3>
        <PropertyCalculator />
      </div>
    </div>
  );
}
