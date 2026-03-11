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
  alertEnabled: boolean;
}

interface AlertEntry {
  id: number;
  signal: string;
  message: string;
  sentAt: string;
  indicator: { key: string; label: string; unit: string | null };
}

type ThresholdField = "warnAbove" | "badAbove" | "warnBelow" | "badBelow";

type SettingsTab = "thresholds" | "alerts";

const THRESHOLD_FIELDS: { key: ThresholdField; label: string; color: string }[] = [
  { key: "warnAbove", label: "Warn Above", color: "text-yellow-400" },
  { key: "badAbove", label: "Bad Above", color: "text-red-400" },
  { key: "warnBelow", label: "Warn Below", color: "text-yellow-400" },
  { key: "badBelow", label: "Bad Below", color: "text-red-400" },
];

const SIGNAL_COLORS: Record<string, string> = {
  ok: "#34d399",
  warn: "#facc15",
  bad: "#f87171",
};

export default function SettingsPage() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [edits, setEdits] = useState<Record<string, Record<ThresholdField, string>>>({});
  const [alertToggles, setAlertToggles] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, { type: "ok" | "error"; text: string }>>({});
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  const [activeTab, setActiveTab] = useState<SettingsTab>("thresholds");
  const [testingDigest, setTestingDigest] = useState(false);
  const [digestMsg, setDigestMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/indicators")
      .then((r) => r.json())
      .then((data) =>
        Promise.all(
          data.map((d: { key: string }) => fetch(`/api/indicators/${d.key}`).then((r) => r.json()))
        )
      )
      .then((details: Indicator[]) => {
        setIndicators(details);
        const initial: Record<string, Record<ThresholdField, string>> = {};
        const toggles: Record<string, boolean> = {};
        for (const ind of details) {
          initial[ind.key] = {
            warnAbove: ind.warnAbove?.toString() ?? "",
            badAbove: ind.badAbove?.toString() ?? "",
            warnBelow: ind.warnBelow?.toString() ?? "",
            badBelow: ind.badBelow?.toString() ?? "",
          };
          toggles[ind.key] = ind.alertEnabled;
        }
        setEdits(initial);
        setAlertToggles(toggles);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === "alerts") {
      fetch("/api/alerts")
        .then((r) => r.json())
        .then(setAlerts)
        .catch(() => {});
    }
  }, [activeTab]);

  function handleChange(key: string, field: ThresholdField, value: string) {
    setEdits((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
    setMessages((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleToggleAlert(key: string) {
    const newVal = !alertToggles[key];
    setAlertToggles((prev) => ({ ...prev, [key]: newVal }));
    await fetch(`/api/indicators/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertEnabled: newVal }),
    });
  }

  async function handleSave(key: string) {
    setSaving((prev) => ({ ...prev, [key]: true }));
    const fields = edits[key];
    const body: Record<string, number | null | boolean> = {};
    for (const f of THRESHOLD_FIELDS) {
      body[f.key] = fields[f.key] === "" ? null : Number(fields[f.key]);
    }
    body.alertEnabled = alertToggles[key];

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

  async function handleTestDigest() {
    setTestingDigest(true);
    setDigestMsg(null);
    try {
      const res = await fetch("/api/alerts/test", { method: "POST" });
      const data = await res.json();
      setDigestMsg(data.message || data.error);
    } catch {
      setDigestMsg("Failed to send test digest");
    } finally {
      setTestingDigest(false);
    }
  }

  const local = indicators.filter((i) => i.category === "local");
  const economic = indicators.filter((i) => i.category === "economic");

  const groups = [
    { label: "Local Market", indicators: local },
    { label: "Economic", indicators: economic },
  ];

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "thresholds", label: "Thresholds" },
    { id: "alerts", label: "Alert History" },
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
          <h1 className="text-xl font-bold text-gray-100">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure thresholds, alert rules, and notification preferences.
          </p>
        </div>

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

        {loading && <div className="text-gray-500 text-sm">Loading...</div>}

        {/* Thresholds tab */}
        {activeTab === "thresholds" && !loading && (
          <div>
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
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-200">{ind.label}</span>
                          {ind.unit && (
                            <span className="text-xs text-gray-500">({ind.unit})</span>
                          )}
                          <button
                            onClick={() => handleToggleAlert(ind.key)}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                              alertToggles[ind.key]
                                ? "border-emerald-400/40 text-emerald-400 bg-emerald-400/10"
                                : "border-gray-600 text-gray-500 bg-gray-900"
                            }`}
                            title={alertToggles[ind.key] ? "Alerts enabled" : "Alerts disabled"}
                          >
                            {alertToggles[ind.key] ? "Alerts ON" : "Alerts OFF"}
                          </button>
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

            {/* Notification config info */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">
                Notifications
              </h2>
              <p className="text-sm text-gray-400 mb-3">
                Email and webhook notifications are configured via environment variables.
                Set these in your <code className="text-gray-300 bg-gray-900 px-1 rounded">.env</code> file:
              </p>
              <div className="bg-gray-900 rounded p-3 text-xs font-mono text-gray-400 space-y-1">
                <div>SMTP_HOST=smtp.gmail.com</div>
                <div>SMTP_PORT=587</div>
                <div>SMTP_USER=you@gmail.com</div>
                <div>SMTP_PASS=app-password</div>
                <div>SMTP_FROM=alerts@yourdomain.com</div>
                <div>ALERT_EMAIL=you@gmail.com</div>
                <div>WEBHOOK_URL=https://hooks.slack.com/...</div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={handleTestDigest}
                  disabled={testingDigest}
                  className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded transition-colors"
                >
                  {testingDigest ? "Sending..." : "Send Test Digest"}
                </button>
                {digestMsg && (
                  <span className="text-xs text-gray-400">{digestMsg}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Alert History tab */}
        {activeTab === "alerts" && (
          <div>
            {alerts.length === 0 && (
              <div className="text-gray-500 text-sm py-4 text-center">
                No alerts triggered yet. Alerts fire when an indicator's signal changes (e.g., OK → Warning).
              </div>
            )}
            {alerts.length > 0 && (
              <div className="space-y-1">
                <div className="grid grid-cols-[120px_1fr_80px] gap-2 px-3 py-2 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                  <span>Date</span>
                  <span>Message</span>
                  <span className="text-right">Signal</span>
                </div>
                {alerts.map((alert) => {
                  const color = SIGNAL_COLORS[alert.signal] ?? "#818cf8";
                  const label = alert.signal === "ok" ? "OK" : alert.signal === "warn" ? "Warning" : "Alert";
                  return (
                    <div
                      key={alert.id}
                      className="grid grid-cols-[120px_1fr_80px] gap-2 px-3 py-2 text-sm border-b border-gray-800/50 hover:bg-gray-800/30"
                    >
                      <span className="text-xs text-gray-500 font-mono">
                        {new Date(alert.sentAt).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-gray-300 text-xs">{alert.message}</span>
                      <span className="text-right">
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ color, backgroundColor: `${color}15` }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {label}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
