"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fmt, fmtDate } from "@/lib/formatters";
import type { MonthlySnapshot, DebtAccount } from "@prisma/client";

interface Props {
  snapshots: MonthlySnapshot[];
  debts: DebtAccount[];
  mortgageBalance: number;
}

export default function DebtsTab({ snapshots, debts, mortgageBalance }: Props) {
  const nonMortgageTotal = debts.reduce((s, d) => s + d.currentBalance, 0);
  const totalLiab = nonMortgageTotal + mortgageBalance;

  const paydownData = snapshots.map((s) => ({
    date: fmtDate(s.date),
    liabilities: Math.abs(s.liabilitiesTotal),
    mortgage: Math.abs(s.mortgageBalance),
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Total Liabilities</div>
          <div className="text-xl font-mono font-bold text-red-400">{fmt(totalLiab)}</div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Mortgage</div>
          <div className="text-xl font-mono font-bold text-red-400/70">{fmt(mortgageBalance)}</div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Non-Mortgage</div>
          <div className="text-xl font-mono font-bold text-yellow-400">{fmt(nonMortgageTotal)}</div>
        </div>
      </div>

      {/* Debt breakdown table */}
      <div className="bg-gray-800/60 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-3 border-b border-gray-700">
          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Debt Accounts
          </h3>
        </div>
        {debts.map((d) => {
          const pctPaid =
            d.startBalance !== 0 ? Math.abs(d.paid / d.startBalance) : 0;
          const estimatedStr = d.estimatedFinal
            ? new Date(d.estimatedFinal).toLocaleDateString("en-AU", {
                month: "short",
                year: "numeric",
              })
            : null;

          return (
            <div key={d.id} className="p-3 border-b border-gray-700/50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-sm font-medium text-gray-200">{d.name}</div>
                  <div className="text-xs text-gray-500">
                    {d.interestRate > 0 ? `${(d.interestRate * 100).toFixed(1)}% p.a.` : "0% interest"}
                    {estimatedStr && ` · Est. payoff ${estimatedStr}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-red-400 text-sm">
                    {fmt(d.currentBalance)}
                  </div>
                  <div className="text-xs text-gray-500">of {fmt(d.startBalance)}</div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${Math.min(pctPaid * 100, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {(pctPaid * 100).toFixed(0)}% paid · {fmt(Math.abs(d.paid))} repaid
              </div>
            </div>
          );
        })}
      </div>

      {/* Paydown history chart */}
      <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
          Non-Mortgage Debt Paydown
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={paydownData}>
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
              <Line
                type="monotone"
                dataKey="liabilities"
                stroke="#f87171"
                strokeWidth={2}
                dot={false}
                name="Non-Mortgage Debt"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
