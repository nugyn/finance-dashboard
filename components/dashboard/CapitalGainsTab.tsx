"use client";

import { fmt } from "@/lib/formatters";
import type { AssetTransaction } from "@prisma/client";

interface Props {
  transactions: AssetTransaction[];
  taxRate: number;
  longTermTaxRate: number;
}

interface CGTEvent {
  ticker: string;
  sellDate: Date;
  units: number;
  proceeds: number;
  costBase: number;
  gain: number;
  isLongTerm: boolean;
  taxOwed: number;
}

function computeFifoCgt(transactions: AssetTransaction[], stRate: number, ltRate: number): CGTEvent[] {
  const events: CGTEvent[] = [];

  // Group transactions by ticker
  const byTicker = transactions.reduce(
    (acc, t) => {
      if (!acc[t.ticker]) acc[t.ticker] = [];
      acc[t.ticker].push(t);
      return acc;
    },
    {} as Record<string, AssetTransaction[]>
  );

  for (const [ticker, txs] of Object.entries(byTicker)) {
    const sorted = [...txs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const lots: { date: Date; units: number; price: number }[] = [];

    for (const tx of sorted) {
      if (tx.units > 0) {
        lots.push({ date: new Date(tx.date), units: tx.units, price: tx.price });
      } else if (tx.units < 0) {
        let remaining = Math.abs(tx.units);
        const sellDate = new Date(tx.date);
        let costBase = 0;

        while (remaining > 0 && lots.length > 0) {
          const lot = lots[0];
          const consumed = Math.min(lot.units, remaining);
          costBase += consumed * lot.price;
          lot.units -= consumed;
          remaining -= consumed;
          if (lot.units <= 0) lots.shift();
        }

        const proceeds = Math.abs(tx.units) * tx.price;
        const gain = proceeds - costBase;
        const holdingMs = sellDate.getTime() - (lots[0]?.date.getTime() ?? sellDate.getTime());
        const isLongTerm = holdingMs > 365 * 24 * 3600 * 1000;
        const rate = isLongTerm ? ltRate : stRate;

        events.push({
          ticker,
          sellDate,
          units: Math.abs(tx.units),
          proceeds,
          costBase,
          gain,
          isLongTerm,
          taxOwed: Math.max(0, gain * rate),
        });
      }
    }
  }

  return events.sort((a, b) => b.sellDate.getTime() - a.sellDate.getTime());
}

export default function CapitalGainsTab({ transactions, taxRate, longTermTaxRate }: Props) {
  const sells = transactions.filter((t) => t.units < 0);
  const events = computeFifoCgt(transactions, taxRate, longTermTaxRate);

  const totalGain = events.reduce((s, e) => s + e.gain, 0);
  const totalTax = events.reduce((s, e) => s + e.taxOwed, 0);

  if (sells.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        No CGT events found. Sell transactions will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Total Capital Gain</div>
          <div
            className={`text-xl font-mono font-bold ${
              totalGain >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {fmt(totalGain)}
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">Est. Tax Owed</div>
          <div className="text-xl font-mono font-bold text-yellow-400">{fmt(totalTax)}</div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-500">CGT Events</div>
          <div className="text-xl font-mono font-bold text-gray-200">{events.length}</div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        ST rate: {(taxRate * 100).toFixed(0)}% · LT rate: {(longTermTaxRate * 100).toFixed(0)}% (FIFO method)
      </div>

      <div className="bg-gray-800/60 rounded-lg border border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-3 text-xs text-gray-500 font-medium">Ticker</th>
              <th className="text-left p-3 text-xs text-gray-500 font-medium">Sell Date</th>
              <th className="text-right p-3 text-xs text-gray-500 font-medium">Units</th>
              <th className="text-right p-3 text-xs text-gray-500 font-medium">Proceeds</th>
              <th className="text-right p-3 text-xs text-gray-500 font-medium">Cost Base</th>
              <th className="text-right p-3 text-xs text-gray-500 font-medium">Gain</th>
              <th className="text-right p-3 text-xs text-gray-500 font-medium">Term</th>
              <th className="text-right p-3 text-xs text-gray-500 font-medium">Est. Tax</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i} className="border-b border-gray-700/50">
                <td className="p-3 font-medium text-gray-200">{e.ticker}</td>
                <td className="p-3 text-gray-400 text-xs">
                  {e.sellDate.toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="p-3 text-right font-mono text-gray-300">{e.units}</td>
                <td className="p-3 text-right font-mono text-gray-200">{fmt(e.proceeds)}</td>
                <td className="p-3 text-right font-mono text-gray-400">{fmt(e.costBase)}</td>
                <td
                  className={`p-3 text-right font-mono ${
                    e.gain >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {fmt(e.gain)}
                </td>
                <td className="p-3 text-right">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      e.isLongTerm
                        ? "bg-emerald-400/10 text-emerald-400"
                        : "bg-yellow-400/10 text-yellow-400"
                    }`}
                  >
                    {e.isLongTerm ? "Long" : "Short"}
                  </span>
                </td>
                <td className="p-3 text-right font-mono text-yellow-400">{fmt(e.taxOwed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
