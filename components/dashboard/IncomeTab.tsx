"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fmt, fmtDate } from "@/lib/formatters";
import type { SideIncomeEntry, DividendEntry } from "@prisma/client";

interface Props {
  sideIncome: SideIncomeEntry[];
  dividends: DividendEntry[];
}

export default function IncomeTab({ sideIncome, dividends }: Props) {
  const ytdIncome = sideIncome.reduce(
    (s, e) => s + e.sideIncome + e.rentalIncome,
    0
  );
  const totalDividends = dividends.reduce((s, d) => s + d.netAmount, 0);

  const chartData = sideIncome.map((e) => ({
    date: fmtDate(e.date),
    rental: e.rentalIncome,
    side: e.sideIncome,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">YTD Side + Rental</div>
          <div className="text-xl font-mono font-bold text-emerald-400">{fmt(ytdIncome)}</div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Total Dividends</div>
          <div className="text-xl font-mono font-bold text-indigo-400">{fmt(totalDividends)}</div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Total Passive</div>
          <div className="text-xl font-mono font-bold text-yellow-400">
            {fmt(ytdIncome + totalDividends)}
          </div>
        </div>
      </div>

      {/* Rental income chart */}
      <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
          Monthly Income
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 10 }}
                tickFormatter={(v) => `$${Math.round(v)}`}
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
              <Bar dataKey="rental" fill="#60a5fa" name="Rental" radius={[2, 2, 0, 0]} stackId="a" />
              <Bar dataKey="side" fill="#34d399" name="Side Income" radius={[2, 2, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dividend table */}
      {dividends.length > 0 && (
        <div className="bg-gray-800/60 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Dividends
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3 text-xs text-gray-500 font-medium">Date</th>
                <th className="text-left p-3 text-xs text-gray-500 font-medium">Ticker</th>
                <th className="text-left p-3 text-xs text-gray-500 font-medium">Type</th>
                <th className="text-right p-3 text-xs text-gray-500 font-medium">Net Amount</th>
              </tr>
            </thead>
            <tbody>
              {dividends.map((d) => (
                <tr key={d.id} className="border-b border-gray-700/50">
                  <td className="p-3 text-gray-400 text-xs">
                    {new Date(d.paymentDate).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-3 font-medium text-gray-200">{d.ticker}</td>
                  <td className="p-3 text-gray-400">{d.holdingType}</td>
                  <td className="p-3 text-right font-mono text-emerald-400">{fmt(d.netAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Side income notes */}
      {sideIncome.some((e) => e.notes) && (
        <div className="bg-gray-800/60 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Notes
            </h3>
          </div>
          {sideIncome
            .filter((e) => e.notes)
            .map((e) => (
              <div key={e.id} className="p-3 border-b border-gray-700/50">
                <div className="text-xs text-gray-500 mb-1">{fmtDate(e.date)}</div>
                <div className="text-sm text-gray-300">{e.notes}</div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
