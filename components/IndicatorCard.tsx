"use client";

import { useState } from "react";

export type Signal = "ok" | "warn" | "bad";

interface Props {
  indicatorKey: string;
  label: string;
  value: number | null;
  unit?: string | null;
  signal: Signal | null;
  lastFetched: string | null;
  onRefresh?: (key: string, newValue: number, signal: Signal) => void;
}

const SIGNAL_COLORS: Record<Signal, string> = {
  ok: "text-emerald-400",
  warn: "text-yellow-400",
  bad: "text-red-400",
};

const SIGNAL_BG: Record<Signal, string> = {
  ok: "bg-emerald-400/10 border-emerald-400/20",
  warn: "bg-yellow-400/10 border-yellow-400/20",
  bad: "bg-red-400/10 border-red-400/20",
};

const SIGNAL_DOT: Record<Signal, string> = {
  ok: "bg-emerald-400",
  warn: "bg-yellow-400",
  bad: "bg-red-400",
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatValue(value: number, unit?: string | null): string {
  if (unit === "$") {
    return value >= 1000000
      ? `$${(value / 1000000).toFixed(2)}M`
      : `$${Math.round(value).toLocaleString("en-AU")}`;
  }
  if (unit === "%") return `${value.toFixed(2)}%`;
  if (unit === "count" || unit === "listings") return Math.round(value).toLocaleString("en-AU");
  return value.toFixed(2);
}

export default function IndicatorCard({
  indicatorKey,
  label,
  value,
  unit,
  signal,
  lastFetched,
  onRefresh,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/indicators/${indicatorKey}/refresh`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refresh failed");
      onRefresh?.(indicatorKey, data.snapshot.value, data.signal as Signal);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const effectiveSignal = signal ?? "ok";
  const hasData = value !== null;

  return (
    <div
      className={`rounded-lg border p-4 ${hasData ? SIGNAL_BG[effectiveSignal] : "bg-gray-800/50 border-gray-700"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {hasData && (
              <span
                className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${SIGNAL_DOT[effectiveSignal]}`}
              />
            )}
            <span className="text-xs text-gray-400 uppercase tracking-wider truncate">{label}</span>
          </div>

          {hasData ? (
            <div className={`text-2xl font-mono font-bold ${SIGNAL_COLORS[effectiveSignal]}`}>
              {formatValue(value!, unit)}
            </div>
          ) : (
            <div className="text-lg text-gray-500 font-mono">—</div>
          )}

          {lastFetched && (
            <div className="text-xs text-gray-500 mt-1">{formatTimeAgo(lastFetched)}</div>
          )}
          {!lastFetched && (
            <div className="text-xs text-gray-600 mt-1">Never fetched</div>
          )}
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex-shrink-0 text-xs text-gray-500 hover:text-indigo-400 transition-colors disabled:opacity-40 mt-1"
          title="Refresh"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
        </button>
      </div>

      {error && <div className="mt-2 text-xs text-red-400 truncate">{error}</div>}
    </div>
  );
}
