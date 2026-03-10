"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { fmt, fmtDate, fmtPct } from "@/lib/formatters";
import type { MonthlySnapshot, CashAccount } from "@prisma/client";

interface Props {
  snapshots: MonthlySnapshot[];
  accounts: CashAccount[];
  eoyGoal: number;
}

export default function CashTab({ snapshots, accounts, eoyGoal }: Props) {
  const latest = snapshots[snapshots.length - 1];
  const totalCash = accounts.reduce((sum, a) => sum + a.balance, 0);
  const onTrack = totalCash >= eoyGoal * 0.5; // halfway through year heuristic

  const chartData = snapshots.map((s) => ({
    date: fmtDate(s.date),
    cash: s.cashValue,
    savingsRate: s.cashSavingsRate * 100,
    spend: s.cashMonthlySpend,
  }));

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Cash Balance</div>
          <div className="text-xl font-mono font-bold text-emerald-400">{fmt(totalCash)}</div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">EOY Goal</div>
          <div className="text-xl font-mono font-bold text-indigo-400">{fmt(eoyGoal)}</div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">On Track</div>
            <div
              className={`text-sm font-bold mt-1 ${onTrack ? "text-emerald-400" : "text-yellow-400"}`}
            >
              {onTrack ? "Yes" : "Check"}
            </div>
          </div>
          <div className="text-2xl">{onTrack ? "✓" : "⚠"}</div>
        </div>
      </div>

      {/* Accounts list */}
      {accounts.length > 0 && (
        <div className="bg-gray-800/60 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Accounts
            </h3>
          </div>
          {accounts.map((acc) => (
            <div key={acc.id} className="flex justify-between items-center p-3 border-b border-gray-700/50">
              <span className="text-sm text-gray-300">{acc.name}</span>
              <span className="font-mono text-emerald-400 font-bold">{fmt(acc.balance)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Cash history chart */}
      <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
          Cash History
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
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
              <Bar dataKey="cash" fill="#34d399" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Savings rate overlay */}
      <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
          Savings Rate
        </h3>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <Tooltip
                contentStyle={{
                  background: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: 6,
                  fontSize: 11,
                }}
                formatter={(v) => [`${Number(v).toFixed(1)}%`, "Savings Rate"]}
              />
              <Line
                type="monotone"
                dataKey="savingsRate"
                stroke="#818cf8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spend notes */}
      {snapshots.some((s) => s.cashNotes) && (
        <div className="bg-gray-800/60 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Spend Notes
            </h3>
          </div>
          {snapshots
            .filter((s) => s.cashNotes)
            .reverse()
            .map((s) => (
              <div key={s.id} className="p-3 border-b border-gray-700/50">
                <div className="text-xs text-gray-500 mb-1">{fmtDate(s.date)}</div>
                <div className="text-sm text-gray-300">{s.cashNotes}</div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
