"use client";

import { useEffect, useState, useCallback } from "react";
import IndicatorCard, { type Signal } from "@/components/IndicatorCard";
import SparklineChart from "@/components/SparklineChart";
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

type SubTab = "local" | "economic" | "trends";

const SIGNAL_COLORS: Record<string, string> = {
  ok: "#34d399",
  warn: "#facc15",
  bad: "#f87171",
};

export default function MarketIndicatorsPage() {
  const [indicators, setIndicators] = useState<IndicatorWithLatest[]>([]);
  const [history, setHistory] = useState<Record<string, IndicatorWithHistory>>({});
  const [activeTab, setActiveTab] = useState<SubTab>("local");
  const [loading, setLoading] = useState(true);

  const fetchIndicators = useCallback(async () => {
    try {
      const res = await fetch("/api/indicators");
      const data: IndicatorWithLatest[] = await res.json();
      setIndicators(data);
    } catch (err) {
      console.error("Failed to fetch indicators:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    const res = await fetch("/api/indicators");
    const data: IndicatorWithLatest[] = await res.json();

    const historyMap: Record<string, IndicatorWithHistory> = {};
    await Promise.all(
      data.map(async (ind) => {
        const r = await fetch(`/api/indicators/${ind.key}`);
        const detail: IndicatorWithHistory = await r.json();
        historyMap[ind.key] = detail;
      })
    );
    setHistory(historyMap);
  }, []);

  useEffect(() => {
    fetchIndicators();
  }, [fetchIndicators]);

  useEffect(() => {
    if (activeTab === "trends") {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

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

  const local = indicators.filter((i) => i.category === "local");
  const economic = indicators.filter((i) => i.category === "economic");

  const tabs: { id: SubTab; label: string }[] = [
    { id: "local", label: "Local Market" },
    { id: "economic", label: "Economic" },
    { id: "trends", label: "Trends" },
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
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-6 h-14">
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
          <div className="flex gap-4 mb-6">
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
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-300">{ind.label}</span>
                      {latest && (
                        <span
                          className="text-xs font-mono font-bold"
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
                    <SparklineChart
                      data={ind.snapshots}
                      color={color}
                      label={ind.label}
                      unit={ind.unit}
                    />
                    <div className="text-xs text-gray-600 mt-1">
                      {ind.snapshots.length} snapshot{ind.snapshots.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
