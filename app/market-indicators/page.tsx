"use client";

import { useEffect, useState, useCallback } from "react";
import IndicatorCard, { type Signal } from "@/components/IndicatorCard";
import TrendChart from "@/components/TrendChart";
import Link from "next/link";

interface Snapshot {
  id: number;
  value: number;
  rawText: string | null;
  signal: string;
  fetchedAt: string;
}

interface IndicatorWithLatest {
  id: number;
  key: string;
  label: string;
  category: string;
  unit: string | null;
  sourceUrl: string | null;
  latest: Snapshot | null;
}

interface IndicatorWithHistory extends IndicatorWithLatest {
  snapshots: Snapshot[];
}

interface AnnotationEntry {
  id: number;
  text: string;
  date: string;
  indicatorId: number | null;
  indicator: { key: string; label: string } | null;
}

type SubTab = "local" | "economic" | "trends" | "history" | "scenarios";

const SIGNAL_COLORS: Record<string, string> = {
  ok: "#34d399",
  warn: "#facc15",
  bad: "#f87171",
};

export default function MarketIndicatorsPage() {
  const [indicators, setIndicators] = useState<IndicatorWithLatest[]>([]);
  const [history, setHistory] = useState<Record<string, IndicatorWithHistory>>({});
  const [annotations, setAnnotations] = useState<AnnotationEntry[]>([]);
  const [activeTab, setActiveTab] = useState<SubTab>("local");
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [noteIndicator, setNoteIndicator] = useState<string>("");
  const [addingNote, setAddingNote] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch("/api/indicators");
      const data: IndicatorWithLatest[] = await res.json();
      setIndicators(data);

      const historyMap: Record<string, IndicatorWithHistory> = {};
      await Promise.all(
        data.map(async (ind) => {
          const r = await fetch(`/api/indicators/${ind.key}`);
          const detail: IndicatorWithHistory = await r.json();
          historyMap[ind.key] = detail;
        })
      );
      setHistory(historyMap);
    } catch (err) {
      console.error("Failed to fetch indicators:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    fetch("/api/annotations")
      .then((r) => r.json())
      .then(setAnnotations)
      .catch(() => {});
  }, [fetchAll]);

  function handleRefresh(key: string, newValue: number, signal: Signal) {
    setIndicators((prev) =>
      prev.map((ind) =>
        ind.key === key
          ? {
              ...ind,
              latest: {
                id: Date.now(),
                value: newValue,
                rawText: String(newValue),
                signal,
                fetchedAt: new Date().toISOString(),
              },
            }
          : ind
      )
    );
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const body: Record<string, unknown> = { text: noteText.trim() };
      if (noteIndicator) {
        const ind = indicators.find((i) => i.key === noteIndicator);
        if (ind) body.indicatorId = ind.id;
      }
      const res = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const created: AnnotationEntry = await res.json();
      setAnnotations((prev) => [created, ...prev]);
      setNoteText("");
      setNoteIndicator("");
    } catch {
      // silent
    } finally {
      setAddingNote(false);
    }
  }

  async function handleDeleteNote(id: number) {
    await fetch(`/api/annotations?id=${id}`, { method: "DELETE" });
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }

  const local = indicators.filter((i) => i.category === "local");
  const economic = indicators.filter((i) => i.category === "economic");

  const tabs: { id: SubTab; label: string }[] = [
    { id: "local", label: "Local Market" },
    { id: "economic", label: "Economic" },
    { id: "trends", label: "Trends" },
    { id: "history", label: "Signal History" },
    { id: "scenarios", label: "Scenarios" },
  ];

  const signalCounts = indicators.reduce(
    (acc, ind) => {
      const s = ind.latest?.signal ?? "ok";
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Top nav */}
      <div className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-4 sm:gap-6 h-14 overflow-x-auto">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Property Calculator
          </Link>
          <span className="text-sm font-medium text-indigo-400 border-b-2 border-indigo-400 pb-px h-full flex items-end pb-0 leading-[3.5rem]">
            Market Indicators
          </span>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Settings
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-100">
            Australian Property Market Indicators
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Werribee / Wyndham hold-to-sell strategy · Target: March 2027
          </p>
        </div>

        {/* Signal summary */}
        {!loading && indicators.length > 0 && (
          <div className="flex items-center gap-4 mb-6">
            {[
              { key: "ok", label: "OK", color: "text-emerald-400" },
              { key: "warn", label: "Warning", color: "text-yellow-400" },
              { key: "bad", label: "Alert", color: "text-red-400" },
            ].map(({ key, label, color }) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`text-2xl font-mono font-bold ${color}`}>
                  {signalCounts[key] ?? 0}
                </span>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
            <a
              href="/api/export/indicators"
              className="ml-auto text-xs px-3 py-1.5 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400 rounded transition-colors"
            >
              Export CSV
            </a>
          </div>
        )}

        {/* Sub-tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm transition-colors ${
                activeTab === tab.id
                  ? "text-indigo-400 border-b-2 border-indigo-400 -mb-px"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-gray-500 text-sm">Loading indicators...</div>
        )}

        {/* Local Market tab */}
        {activeTab === "local" && !loading && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {local.length === 0 && (
                <div className="col-span-3 text-gray-500 text-sm">No local indicators found.</div>
              )}
              {local.map((ind) => (
                <IndicatorCard
                  key={ind.key}
                  indicatorKey={ind.key}
                  label={ind.label}
                  value={ind.latest?.value ?? null}
                  unit={ind.unit}
                  signal={(ind.latest?.signal as Signal) ?? null}
                  lastFetched={ind.latest?.fetchedAt ?? null}
                  snapshots={history[ind.key]?.snapshots}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-4">
              Click the refresh icon on any card to fetch the latest data. Scrapers depend on
              Domain.com.au and SQM Research page structure — may need updates if pages change.
            </p>
          </div>
        )}

        {/* Economic tab */}
        {activeTab === "economic" && !loading && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {economic.length === 0 && (
                <div className="col-span-3 text-gray-500 text-sm">No economic indicators found.</div>
              )}
              {economic.map((ind) => (
                <IndicatorCard
                  key={ind.key}
                  indicatorKey={ind.key}
                  label={ind.label}
                  value={ind.latest?.value ?? null}
                  unit={ind.unit}
                  signal={(ind.latest?.signal as Signal) ?? null}
                  lastFetched={ind.latest?.fetchedAt ?? null}
                  snapshots={history[ind.key]?.snapshots}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-4">
              RBA rate scraped from rba.gov.au. CPI/WPI/Dwelling Approvals from ABS API
              (api.data.abs.gov.au). ABS dataflow keys may need updating quarterly.
            </p>
          </div>
        )}

        {/* Trends tab */}
        {activeTab === "trends" && (
          <div>
            {Object.keys(history).length === 0 && (
              <div className="text-gray-500 text-sm">
                Loading trend data... (Refresh indicators to build history)
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.values(history).map((ind) => {
                const latest = ind.snapshots[0];
                const signal = (latest?.signal ?? "ok") as Signal;
                const color = SIGNAL_COLORS[signal] ?? "#818cf8";

                return (
                  <div key={ind.key} className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-200">{ind.label}</span>
                      {latest && (
                        <span
                          className="text-sm font-mono font-bold"
                          style={{ color }}
                        >
                          {ind.unit === "$"
                            ? `$${Math.round(latest.value).toLocaleString("en-AU")}`
                            : ind.unit === "%"
                            ? `${latest.value.toFixed(2)}%`
                            : latest.value.toLocaleString("en-AU")}
                        </span>
                      )}
                    </div>
                    <TrendChart
                      data={ind.snapshots}
                      color={color}
                      label={ind.label}
                      unit={ind.unit}
                    />
                    <div className="text-xs text-gray-600 mt-2">
                      {ind.snapshots.length} snapshot{ind.snapshots.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Annotations */}
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">
                Notes & Annotations
              </h3>
              <div className="flex gap-2 mb-3">
                <select
                  value={noteIndicator}
                  onChange={(e) => setNoteIndicator(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-300 focus:border-indigo-400 focus:outline-none"
                >
                  <option value="">General</option>
                  {indicators.map((ind) => (
                    <option key={ind.key} value={ind.key}>{ind.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  placeholder="Add a note (e.g. 'received private offer 700k')"
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:border-indigo-400 focus:outline-none"
                />
                <button
                  onClick={handleAddNote}
                  disabled={addingNote || !noteText.trim()}
                  className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded transition-colors whitespace-nowrap"
                >
                  Add Note
                </button>
              </div>
              {annotations.length > 0 && (
                <div className="space-y-1">
                  {annotations.map((note) => (
                    <div
                      key={note.id}
                      className="flex items-start gap-2 px-3 py-2 bg-gray-800/40 rounded text-sm group"
                    >
                      <span className="text-xs text-gray-500 font-mono shrink-0 pt-0.5">
                        {new Date(note.date).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      {note.indicator && (
                        <span className="text-xs text-indigo-400 shrink-0 pt-0.5">
                          {note.indicator.label}
                        </span>
                      )}
                      <span className="text-gray-300 flex-1">{note.text}</span>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs shrink-0"
                        title="Delete note"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signal History tab */}
        {activeTab === "history" && (
          <div>
            {Object.keys(history).length === 0 && (
              <div className="text-gray-500 text-sm">Loading signal history...</div>
            )}
            {Object.keys(history).length > 0 && (() => {
              const allEvents = Object.values(history).flatMap((ind) =>
                ind.snapshots.map((snap) => ({
                  key: ind.key,
                  label: ind.label,
                  unit: ind.unit,
                  value: snap.value,
                  signal: snap.signal as Signal,
                  fetchedAt: snap.fetchedAt,
                }))
              );
              allEvents.sort(
                (a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime()
              );

              return (
                <div className="space-y-1">
                  <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[1fr_2fr_1fr_1fr] gap-2 px-3 py-2 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                    <span>Date</span>
                    <span>Indicator</span>
                    <span className="text-right hidden sm:block">Value</span>
                    <span className="text-right">Signal</span>
                  </div>
                  {allEvents.map((evt, i) => {
                    const signalColor = SIGNAL_COLORS[evt.signal] ?? "#818cf8";
                    const signalLabel = evt.signal === "ok" ? "OK" : evt.signal === "warn" ? "Warning" : "Alert";
                    return (
                      <div
                        key={`${evt.key}-${i}`}
                        className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[1fr_2fr_1fr_1fr] gap-2 px-3 py-2 text-sm border-b border-gray-800/50 hover:bg-gray-800/30"
                      >
                        <span className="text-xs text-gray-500 font-mono">
                          {new Date(evt.fetchedAt).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-gray-300">{evt.label}</span>
                        <span className="text-right font-mono text-gray-200 hidden sm:block">
                          {evt.unit === "$"
                            ? `$${Math.round(evt.value).toLocaleString("en-AU")}`
                            : evt.unit === "%"
                            ? `${evt.value.toFixed(2)}%`
                            : evt.value.toLocaleString("en-AU")}
                        </span>
                        <span className="text-right">
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              color: signalColor,
                              backgroundColor: `${signalColor}15`,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: signalColor }}
                            />
                            {signalLabel}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                  {allEvents.length === 0 && (
                    <div className="text-gray-500 text-sm py-4 text-center">
                      No snapshots recorded yet. Refresh indicators to build history.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Scenarios tab */}
        {activeTab === "scenarios" && <RateScenarios />}
      </div>
    </div>
  );
}

function RateScenarios() {
  const [rate, setRate] = useState(5.96);
  const [loanBalance, setLoanBalance] = useState(475000);
  const [monthlyRent, setMonthlyRent] = useState(1800);
  const [propertyValue, setPropertyValue] = useState(680000);

  const scenarios = [
    { label: "Rate cut −0.50%", delta: -0.50 },
    { label: "Rate cut −0.25%", delta: -0.25 },
    { label: "Current rate", delta: 0 },
    { label: "Rate hike +0.25%", delta: 0.25 },
    { label: "Rate hike +0.50%", delta: 0.50 },
    { label: "Rate hike +1.00%", delta: 1.00 },
    { label: "Rate hike +1.50%", delta: 1.50 },
  ];

  function calcMonthly(r: number) {
    const mr = r / 100 / 12;
    const n = 360;
    const repayment = mr > 0 ? (loanBalance * (mr * Math.pow(1 + mr, n))) / (Math.pow(1 + mr, n) - 1) : loanBalance / n;
    const interest = loanBalance * (r / 100 / 12);
    const monthlyRates = 1400 / 12;
    const monthlyInsurance = 1300 / 12;
    const pmFees = 130;
    const totalCost = repayment + monthlyRates + monthlyInsurance + pmFees;
    const shortfall = totalCost - monthlyRent;
    return { repayment, interest, totalCost, shortfall };
  }

  const current = calcMonthly(rate);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-200 mb-3">Rate Hike Impact Calculator</h2>
        <p className="text-xs text-gray-500 mb-4">
          See how RBA rate changes affect your monthly holding cost.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Current Rate %</label>
            <input
              type="number"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm font-mono text-gray-200 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Loan Balance</label>
            <input
              type="number"
              step="1000"
              value={loanBalance}
              onChange={(e) => setLoanBalance(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm font-mono text-gray-200 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Monthly Rent</label>
            <input
              type="number"
              step="50"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm font-mono text-gray-200 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Property Value</label>
            <input
              type="number"
              step="5000"
              value={propertyValue}
              onChange={(e) => setPropertyValue(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm font-mono text-gray-200 focus:border-indigo-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {scenarios.map((s) => {
          const newRate = rate + s.delta;
          const calc = calcMonthly(newRate);
          const diffFromCurrent = calc.shortfall - current.shortfall;
          const isCurrent = s.delta === 0;
          const isPositive = s.delta < 0;
          const yield_ = ((monthlyRent * 12) / propertyValue * 100);

          return (
            <div
              key={s.label}
              className={`grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 rounded-lg border ${
                isCurrent
                  ? "bg-indigo-400/10 border-indigo-400/30"
                  : "bg-gray-800/60 border-gray-700"
              }`}
            >
              <div>
                <div className="text-sm text-gray-200">{s.label}</div>
                <div className="text-xs text-gray-500 font-mono">{newRate.toFixed(2)}%</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Repayment</div>
                <div className="text-sm font-mono text-gray-200">
                  ${Math.round(calc.repayment).toLocaleString("en-AU")}
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs text-gray-500">Total Cost</div>
                <div className="text-sm font-mono text-gray-200">
                  ${Math.round(calc.totalCost).toLocaleString("en-AU")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Shortfall</div>
                <div className={`text-sm font-mono font-bold ${
                  calc.shortfall <= 0 ? "text-emerald-400" : "text-red-400"
                }`}>
                  ${Math.round(Math.abs(calc.shortfall)).toLocaleString("en-AU")}
                  {calc.shortfall <= 0 ? " surplus" : "/mo"}
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs text-gray-500">vs Current</div>
                <div className={`text-sm font-mono ${
                  diffFromCurrent < -1 ? "text-emerald-400" : diffFromCurrent > 1 ? "text-red-400" : "text-gray-400"
                }`}>
                  {isCurrent ? "—" : `${diffFromCurrent > 0 ? "+" : ""}$${Math.round(Math.abs(diffFromCurrent)).toLocaleString("en-AU")}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <div className="text-xs text-gray-500">Gross Rental Yield</div>
          <div className="text-lg font-mono font-bold text-indigo-400">
            {((monthlyRent * 12) / propertyValue * 100).toFixed(2)}%
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <div className="text-xs text-gray-500">LVR</div>
          <div className="text-lg font-mono font-bold text-gray-200">
            {((loanBalance / propertyValue) * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <div className="text-xs text-gray-500">Break-even Rate</div>
          <div className="text-lg font-mono font-bold text-emerald-400">
            {(() => {
              // Binary search for break-even rate
              let lo = 0, hi = 15;
              for (let i = 0; i < 50; i++) {
                const mid = (lo + hi) / 2;
                const c = calcMonthly(mid);
                if (c.shortfall > 0) hi = mid;
                else lo = mid;
              }
              return ((lo + hi) / 2).toFixed(2);
            })()}%
          </div>
        </div>
      </div>
    </div>
  );
}
