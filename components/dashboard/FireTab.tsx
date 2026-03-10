"use client";

import {
  RadialBarChart,
  RadialBar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fmt } from "@/lib/formatters";
import type { MonthlySnapshot, UserSettings } from "@prisma/client";

interface Props {
  snapshots: MonthlySnapshot[];
  settings: UserSettings[];
}

function getSetting(settings: UserSettings[], key: string, fallback: number): number {
  const s = settings.find((s) => s.key === key);
  return s ? Number(s.value) || fallback : fallback;
}

export default function FireTab({ snapshots, settings }: Props) {
  const latest = snapshots[snapshots.length - 1];

  const withdrawalRate = 0.04;
  const inflation = 0.025;
  const taxBracket = getSetting(settings, "taxBracket", 0.35);
  const marketReturn = getSetting(settings, "marketInvestmentReturn", 0.05);
  const bankRate = getSetting(settings, "bankInterestRate", 0.04);

  // Pre-super FIRE: non-property, non-super investable assets
  const preSuperAssets =
    latest.etfValue + latest.sharesValue + latest.cryptoValue + latest.cashValue + latest.mfValue;

  // Annual salary from latest snapshot
  const annualSalary = latest.salaryMonthly * 12;

  // Target = annual expenses / withdrawal rate
  // Estimate annual expenses as salary * (1 - taxBracket) * savingsRate complement
  const annualIncome = annualSalary * (1 - taxBracket);
  const savingsRateAbs = Math.abs(latest.cashSavingsRate);
  const annualExpenses = annualIncome * (1 - savingsRateAbs);
  const fireTarget = annualExpenses > 0 ? annualExpenses / withdrawalRate : 2750000;

  const preSuperPct = fireTarget > 0 ? Math.min(preSuperAssets / fireTarget, 1) : 0;
  const superPct = latest.superValue > 0 ? Math.min(latest.superValue / fireTarget, 1) : 0;

  const radialData = [
    {
      name: "Pre-Super FIRE",
      value: Math.round(preSuperPct * 100),
      fill: "#818cf8",
    },
    {
      name: "Super FIRE",
      value: Math.round(superPct * 100),
      fill: "#fb923c",
    },
  ];

  // Simple projection: how many years to reach fireTarget
  const annualContrib = latest.salaryMonthly * 12 * savingsRateAbs;
  let yearsToFire: number | null = null;
  if (annualContrib > 0 && preSuperAssets < fireTarget) {
    let balance = preSuperAssets;
    for (let y = 1; y <= 50; y++) {
      balance = balance * (1 + marketReturn) + annualContrib;
      if (balance >= fireTarget) {
        yearsToFire = y;
        break;
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* FIRE ETA */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Pre-Super FIRE</div>
          <div className="text-xl font-mono font-bold text-indigo-400">{fmt(preSuperAssets)}</div>
          <div className="text-xs text-gray-500 mt-1">Target {fmt(fireTarget)}</div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Super Balance</div>
          <div className="text-xl font-mono font-bold text-orange-400">
            {fmt(latest.superValue)}
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">FIRE ETA</div>
          <div className="text-xl font-mono font-bold text-emerald-400">
            {yearsToFire ? `~${yearsToFire} yrs` : "N/A"}
          </div>
        </div>
      </div>

      {/* Radial progress */}
      <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
          FIRE Progress
        </h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={100}
              data={radialData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={4}
                background={{ fill: "#374151" }}
                label={{ position: "insideStart", fill: "#d1d5db", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(v) => [`${v}%`]}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2">
          {radialData.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: d.fill }} />
              <span className="text-xs text-gray-400">
                {d.name}: {d.value}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings display */}
      <div className="bg-gray-800/60 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-3 border-b border-gray-700">
          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            FIRE Assumptions
          </h3>
        </div>
        {[
          { label: "Withdrawal Rate", value: `${(withdrawalRate * 100).toFixed(0)}%` },
          { label: "Inflation", value: `${(inflation * 100).toFixed(1)}%` },
          { label: "Market Return", value: `${(marketReturn * 100).toFixed(0)}%` },
          { label: "Tax Bracket", value: `${(taxBracket * 100).toFixed(0)}%` },
          { label: "Bank Interest", value: `${(bankRate * 100).toFixed(0)}%` },
        ].map((row) => (
          <div
            key={row.label}
            className="flex justify-between p-3 border-b border-gray-700/50 text-sm"
          >
            <span className="text-gray-400">{row.label}</span>
            <span className="font-mono text-gray-200">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
