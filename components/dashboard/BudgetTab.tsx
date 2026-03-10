"use client";

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fmt, fmtPct } from "@/lib/formatters";
import type { BudgetItem, BudgetSummary } from "@prisma/client";

interface Props {
  summary: BudgetSummary | null;
  items: BudgetItem[];
  emergencyMonths: number;
  cashBalance: number;
}

const CAT_COLORS: Record<string, string> = {
  Needs: "#60a5fa",
  Wants: "#f472b6",
  Savings: "#34d399",
  Uncategorised: "#9ca3af",
};

export default function BudgetTab({ summary, items, emergencyMonths, cashBalance }: Props) {
  if (!summary) {
    return <div className="text-gray-500 text-sm">No budget data imported yet.</div>;
  }

  const byCategory = items.reduce(
    (acc, item) => {
      const cat = item.category || "Uncategorised";
      acc[cat] = (acc[cat] ?? 0) + item.monthlyAmt;
      return acc;
    },
    {} as Record<string, number>
  );

  const donutData = Object.entries(byCategory)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value: Math.round(value) }));

  const monthlySpend = summary.monthlyIncome - (byCategory["Savings"] ?? 0);
  const emergencyTarget = monthlySpend * emergencyMonths;
  const emergencyCoverage = cashBalance / emergencyTarget;

  return (
    <div className="space-y-6">
      {/* Income header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Monthly Income</div>
          <div className="text-xl font-mono font-bold text-emerald-400">
            {fmt(summary.monthlyIncome)}
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Annual Income</div>
          <div className="text-xl font-mono font-bold text-indigo-400">
            {fmt(summary.annualIncome)}
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">
            Emergency Fund ({emergencyMonths}m)
          </div>
          <div
            className={`text-sm font-mono font-bold mt-1 ${
              emergencyCoverage >= 1 ? "text-emerald-400" : "text-yellow-400"
            }`}
          >
            {(emergencyCoverage * 100).toFixed(0)}% covered
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Target {fmt(emergencyTarget)}
          </div>
        </div>
      </div>

      {/* Donut */}
      <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
          Budget Breakdown
        </h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  (percent ?? 0) > 0.05 ? `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%` : ""
                }
                labelLine={false}
              >
                {donutData.map((entry) => (
                  <Cell key={entry.name} fill={CAT_COLORS[entry.name] ?? "#6b7280"} />
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
                formatter={(v) => [fmt(Number(v)), "Monthly"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Planned vs actual */}
      {(summary.plannedSpend > 0 || summary.actualSpend6m > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
            <div className="text-xs text-gray-500">Planned Spend/mo</div>
            <div className="text-xl font-mono font-bold text-gray-100">
              {fmt(summary.plannedSpend)}
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
            <div className="text-xs text-gray-500">6m Avg Actual</div>
            <div className="text-xl font-mono font-bold text-yellow-400">
              {fmt(summary.actualSpend6m)}
            </div>
          </div>
        </div>
      )}

      {/* Line items table */}
      <div className="bg-gray-800/60 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-3 border-b border-gray-700">
          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Budget Items
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3 text-xs text-gray-500 font-medium">Item</th>
                <th className="text-left p-3 text-xs text-gray-500 font-medium">Category</th>
                <th className="text-right p-3 text-xs text-gray-500 font-medium">Monthly</th>
                <th className="text-right p-3 text-xs text-gray-500 font-medium">Yearly</th>
                <th className="text-right p-3 text-xs text-gray-500 font-medium">Alloc %</th>
              </tr>
            </thead>
            <tbody>
              {items
                .filter((i) => i.monthlyAmt > 0)
                .sort((a, b) => b.monthlyAmt - a.monthlyAmt)
                .map((item) => (
                  <tr key={item.id} className="border-b border-gray-700/50">
                    <td className="p-3 text-gray-300">{item.name}</td>
                    <td className="p-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: `${CAT_COLORS[item.category] ?? "#6b7280"}20`,
                          color: CAT_COLORS[item.category] ?? "#9ca3af",
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-gray-100">
                      {fmt(item.monthlyAmt)}
                    </td>
                    <td className="p-3 text-right font-mono text-gray-400">
                      {fmt(item.yearlyAmt)}
                    </td>
                    <td className="p-3 text-right font-mono text-gray-500">
                      {fmtPct(item.allocation)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
