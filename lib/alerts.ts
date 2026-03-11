import nodemailer from "nodemailer";
import { db } from "./db";
import type { Signal } from "./signals";

interface AlertIndicator {
  id: number;
  key: string;
  label: string;
  unit: string | null;
  alertEnabled: boolean;
}

const SIGNAL_LABELS: Record<Signal, string> = {
  ok: "OK",
  warn: "Warning",
  bad: "Alert",
};

const SIGNAL_EMOJI: Record<Signal, string> = {
  ok: "✅",
  warn: "⚠️",
  bad: "🚨",
};

function formatValue(value: number, unit: string | null): string {
  if (unit === "$") {
    return value >= 1000000
      ? `$${(value / 1000000).toFixed(2)}M`
      : `$${Math.round(value).toLocaleString("en-AU")}`;
  }
  if (unit === "%") return `${value.toFixed(2)}%`;
  if (unit === "count" || unit === "listings") return Math.round(value).toLocaleString("en-AU");
  return value.toFixed(2);
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendEmail(subject: string, html: string): Promise<boolean> {
  const transporter = getTransporter();
  const to = process.env.ALERT_EMAIL;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!transporter || !to) {
    console.log("[alerts] Email not configured, skipping");
    return false;
  }

  try {
    await transporter.sendMail({ from, to, subject, html });
    console.log(`[alerts] Email sent: ${subject}`);
    return true;
  } catch (err) {
    console.error("[alerts] Email send failed:", err);
    return false;
  }
}

async function sendWebhook(payload: Record<string, unknown>): Promise<boolean> {
  const url = process.env.WEBHOOK_URL;
  if (!url) return false;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("[alerts] Webhook sent");
    return true;
  } catch (err) {
    console.error("[alerts] Webhook failed:", err);
    return false;
  }
}

/**
 * Check if signal changed from previous snapshot and send alert if needed.
 * Only alerts on signal transitions (e.g., ok→warn, warn→bad, bad→ok).
 */
export async function checkAndAlert(
  indicator: AlertIndicator,
  value: number,
  newSignal: Signal
): Promise<void> {
  if (!indicator.alertEnabled) return;

  // Get previous snapshot to detect signal change
  const prevSnapshots = await db.snapshot.findMany({
    where: { indicatorId: indicator.id },
    orderBy: { fetchedAt: "desc" },
    take: 2, // current + previous
  });

  // Need at least 2 snapshots (the one just created + the previous one)
  if (prevSnapshots.length < 2) return;

  const prevSignal = prevSnapshots[1].signal as Signal;
  if (prevSignal === newSignal) return;

  // Signal changed — create alert record
  const message = `${indicator.label} changed from ${SIGNAL_LABELS[prevSignal]} to ${SIGNAL_LABELS[newSignal]}: ${formatValue(value, indicator.unit)}`;

  await db.alert.create({
    data: {
      indicatorId: indicator.id,
      signal: newSignal,
      message,
    },
  });

  console.log(`[alerts] ${message}`);

  // Send email notification
  const emoji = SIGNAL_EMOJI[newSignal];
  const subject = `${emoji} ${indicator.label}: ${SIGNAL_LABELS[newSignal]}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 500px;">
      <h2 style="margin: 0 0 8px;">${emoji} Signal Change: ${indicator.label}</h2>
      <p style="color: #666; margin: 0 0 16px;">
        ${SIGNAL_LABELS[prevSignal]} → <strong>${SIGNAL_LABELS[newSignal]}</strong>
      </p>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #888;">Current Value</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${formatValue(value, indicator.unit)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #888;">Previous Signal</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${SIGNAL_LABELS[prevSignal]}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #888;">New Signal</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${SIGNAL_LABELS[newSignal]}</td>
        </tr>
      </table>
      <p style="color: #999; font-size: 12px; margin-top: 16px;">Finance Dashboard Alert</p>
    </div>
  `;

  await sendEmail(subject, html);

  // Send webhook
  await sendWebhook({
    event: "signal_change",
    indicator: indicator.key,
    label: indicator.label,
    value,
    previousSignal: prevSignal,
    newSignal,
    message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Generate and send a weekly digest of all indicator statuses.
 */
export async function sendWeeklyDigest(): Promise<void> {
  const indicators = await db.indicator.findMany({
    include: {
      snapshots: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
      },
    },
  });

  const rows = indicators.map((ind) => {
    const snap = ind.snapshots[0];
    const signal = (snap?.signal ?? "ok") as Signal;
    return {
      label: ind.label,
      value: snap ? formatValue(snap.value, ind.unit) : "No data",
      signal,
      emoji: SIGNAL_EMOJI[signal],
      signalLabel: SIGNAL_LABELS[signal],
    };
  });

  const alertCount = rows.filter((r) => r.signal === "bad").length;
  const warnCount = rows.filter((r) => r.signal === "warn").length;
  const okCount = rows.filter((r) => r.signal === "ok").length;

  const subject = `📊 Weekly Market Digest: ${alertCount} alerts, ${warnCount} warnings, ${okCount} OK`;

  const tableRows = rows
    .map(
      (r) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.emoji}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.label}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace;">${r.value}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.signalLabel}</td>
        </tr>`
    )
    .join("\n");

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px;">
      <h2 style="margin: 0 0 4px;">📊 Weekly Market Digest</h2>
      <p style="color: #666; margin: 0 0 16px;">
        ${new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </p>
      <div style="margin-bottom: 16px;">
        <span style="color: #f87171; font-weight: bold;">${alertCount} Alert${alertCount !== 1 ? "s" : ""}</span> ·
        <span style="color: #facc15; font-weight: bold;">${warnCount} Warning${warnCount !== 1 ? "s" : ""}</span> ·
        <span style="color: #34d399; font-weight: bold;">${okCount} OK</span>
      </div>
      <table style="border-collapse: collapse; width: 100%;">
        <tr style="background: #f9fafb;">
          <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;"></th>
          <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Indicator</th>
          <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Value</th>
          <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Signal</th>
        </tr>
        ${tableRows}
      </table>
      <p style="color: #999; font-size: 12px; margin-top: 16px;">Finance Dashboard Weekly Digest</p>
    </div>
  `;

  const sent = await sendEmail(subject, html);
  if (sent) {
    console.log("[alerts] Weekly digest sent");
  }

  // Also send webhook
  await sendWebhook({
    event: "weekly_digest",
    summary: { alerts: alertCount, warnings: warnCount, ok: okCount },
    indicators: rows.map((r) => ({
      label: r.label,
      value: r.value,
      signal: r.signal,
    })),
    timestamp: new Date().toISOString(),
  });
}
