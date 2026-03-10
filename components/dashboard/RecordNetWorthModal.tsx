"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

interface FormData {
  etfValue: string;
  sharesValue: string;
  cryptoValue: string;
  mfValue: string;
  cashValue: string;
  cashSavingsRate: string;
  cashMonthlySpend: string;
  cashNotes: string;
  superValue: string;
  superVolContrib: string;
  propertyValue: string;
  mortgageBalance: string;
  liabilitiesTotal: string;
}

const INITIAL: FormData = {
  etfValue: "",
  sharesValue: "0",
  cryptoValue: "0",
  mfValue: "0",
  cashValue: "",
  cashSavingsRate: "",
  cashMonthlySpend: "",
  cashNotes: "",
  superValue: "",
  superVolContrib: "0",
  propertyValue: "",
  mortgageBalance: "",
  liabilitiesTotal: "",
};

export default function RecordNetWorthModal({ onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-AU", { month: "long", year: "numeric" });

  function set(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/finance/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          etfValue: Number(form.etfValue) || 0,
          sharesValue: Number(form.sharesValue) || 0,
          cryptoValue: Number(form.cryptoValue) || 0,
          mfValue: Number(form.mfValue) || 0,
          cashValue: Number(form.cashValue) || 0,
          cashSavingsRate: Number(form.cashSavingsRate) / 100 || 0,
          cashMonthlySpend: Number(form.cashMonthlySpend) || 0,
          cashNotes: form.cashNotes || null,
          superValue: Number(form.superValue) || 0,
          superVolContrib: Number(form.superVolContrib) || 0,
          propertyValue: Number(form.propertyValue) || 0,
          mortgageBalance: -(Math.abs(Number(form.mortgageBalance)) || 0),
          liabilitiesTotal: -(Math.abs(Number(form.liabilitiesTotal)) || 0),
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  const Input = ({
    label,
    field,
    prefix = "$",
    hint,
  }: {
    label: string;
    field: keyof FormData;
    prefix?: string;
    hint?: string;
  }) => (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      <div className="flex">
        {prefix && (
          <span className="bg-gray-700 border border-gray-600 border-r-0 px-2 py-1.5 text-gray-400 text-sm rounded-l">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={form[field]}
          onChange={(e) => set(field, e.target.value)}
          className={`flex-1 bg-gray-800 border border-gray-600 px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-400 ${
            prefix ? "rounded-r" : "rounded"
          }`}
          placeholder="0"
        />
      </div>
      {hint && <div className="text-xs text-gray-600 mt-0.5">{hint}</div>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-gray-100">Record Net Worth</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {monthLabel} · Data will be saved as first of month
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* Investments */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">
              Investments
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="ETF Value" field="etfValue" />
              <Input label="Shares Value" field="sharesValue" />
              <Input label="Crypto Value" field="cryptoValue" />
              <Input label="Managed Funds" field="mfValue" />
            </div>
          </div>

          {/* Cash */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">
              Cash
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Cash Balance" field="cashValue" />
              <Input label="Savings Rate %" field="cashSavingsRate" prefix="%" />
              <Input label="Monthly Spend" field="cashMonthlySpend" />
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Spend Notes</label>
                <textarea
                  value={form.cashNotes}
                  onChange={(e) => set("cashNotes", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 px-2 py-1.5 text-sm text-gray-100 rounded focus:outline-none focus:border-indigo-400 h-16 resize-none"
                  placeholder="Any notable expenses this month..."
                />
              </div>
            </div>
          </div>

          {/* Super */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">
              Super
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Balance" field="superValue" />
              <Input label="Vol. Contributions" field="superVolContrib" hint="Extra contributions this month" />
            </div>
          </div>

          {/* Property */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">
              Property
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Current Value" field="propertyValue" />
              <Input label="Mortgage Balance" field="mortgageBalance" hint="Enter positive — stored as negative" />
            </div>
          </div>

          {/* Liabilities */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">
              Other Liabilities
            </div>
            <Input label="Total Non-Mortgage Debt" field="liabilitiesTotal" hint="HELP + CC + loans. Enter positive." />
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-600 text-gray-400 rounded text-sm hover:border-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Snapshot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
