"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Indicator {
  id: number;
  key: string;
  label: string;
  category: string;
  unit: string | null;
  warnAbove: number | null;
  badAbove: number | null;
  warnBelow: number | null;
  badBelow: number | null;
}

type ThresholdField = "warnAbove" | "badAbove" | "warnBelow" | "badBelow";

const THRESHOLD_FIELDS: { key: ThresholdField; label: string; color: string }[] = [
  { key: "warnAbove", label: "Warn Above", color: "text-yellow-400" },
  { key: "badAbove", label: "Bad Above", color: "text-red-400" },
  { key: "warnBelow", label: "Warn Below", color: "text-yellow-400" },
  { key: "badBelow", label: "Bad Below", color: "text-red-400" },
];

export default function SettingsPage() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [edits, setEdits] = useState<Record<string, Record<ThresholdField, string>>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, { type: "ok" | "error"; text: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/indicators")
      .then((r) => r.json())
      .then((data) => {
        // The GET /api/indicators returns thresholds nested; the individual GET returns flat
        // Fetch each indicator individually for the flat shape
        return Promise.all(
          data.map((d: { key: string }) => fetch(`/api/indicators/${d.key}`).then((r) => r.json()))
        );
      })
      .then((details: Indicator[]) => {
        setIndicators(details);
        const initial: Record<string, Record<ThresholdField, string>> = {};
        for (const ind of details) {
          initial[ind.key] = {
            warnAbove: ind.warnAbove?.toString() ?? "",
            badAbove: ind.badAbove?.toString() ?? "",
            warnBelow: ind.warnBelow?.toString() ?? "",
            badBelow: ind.badBelow?.toString() ?? "",
          };
        }
        setEdits(initial);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleChange(key: string, field: ThresholdField, value: string) {
    setEdits((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
    // Clear message on edit
    setMessages((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSave(key: string) {
    setSaving((prev) => ({ ...prev, [key]: true }));
    const fields = edits[key];
    const body: Record<string, number | null> = {};
    for (const f of THRESHOLD_FIELDS) {
      body[f.key] = fields[f.key] === "" ? null : Number(fields[f.key]);
    }

    try {
      const res = await fetch(`/api/indicators/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => ({ ...prev, [key]: { type: "error", text: err.error } }));
      } else {
        setMessages((prev) => ({ ...prev, [key]: { type: "ok", text: "Saved" } }));
        setTimeout(() => {
          setMessages((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }, 2000);
      }
    } catch {
      setMessages((prev) => ({ ...prev, [key]: { type: "error", text: "Network error" } }));
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  }

  const local = indicators.filter((i) => i.category === "local");
  const economic = indicators.filter((i) => i.category === "economic");

  const groups = [
    { label: "Local Market", indicators: local },
    { label: "Economic", indicators: economic },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Top nav */}
      <div className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-6 h-14">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
            Property Calculator
          </Link>
          <Link
            href="/market-indicators"
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Market Indicators
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-sm font-medium text-indigo-400 border-b-2 border-indigo-400 pb-px h-full flex items-end leading-[3.5rem]">
            Settings
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-100">Signal Thresholds</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure when indicators trigger warning and alert signals. Leave blank to disable a threshold.
          </p>
        </div>

        {loading && <div className="text-gray-500 text-sm">Loading indicators...</div>}

        {groups.map((group) => (
          <div key={group.label} className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
              {group.label}
            </h2>
            <div className="space-y-3">
              {group.indicators.map((ind) => (
                <div
                  key={ind.key}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm font-medium text-gray-200">{ind.label}</span>
                      {ind.unit && (
                        <span className="text-xs text-gray-500 ml-2">({ind.unit})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {messages[ind.key] && (
                        <span
                          className={`text-xs ${
                            messages[ind.key].type === "ok" ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {messages[ind.key].text}
                        </span>
                      )}
                      <button
                        onClick={() => handleSave(ind.key)}
                        disabled={saving[ind.key]}
                        className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded transition-colors"
                      >
                        {saving[ind.key] ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {THRESHOLD_FIELDS.map((f) => (
                      <div key={f.key}>
                        <label className={`text-xs ${f.color} block mb-1`}>{f.label}</label>
                        <input
                          type="number"
                          step="any"
                          value={edits[ind.key]?.[f.key] ?? ""}
                          onChange={(e) => handleChange(ind.key, f.key, e.target.value)}
                          placeholder="—"
                          className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm font-mono text-gray-200 placeholder-gray-600 focus:border-indigo-400 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
