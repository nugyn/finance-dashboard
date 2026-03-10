export type Signal = "ok" | "warn" | "bad";

interface Thresholds {
  warnAbove?: number | null;
  badAbove?: number | null;
  warnBelow?: number | null;
  badBelow?: number | null;
}

export function evaluateSignal(value: number, t: Thresholds): Signal {
  if (t.badAbove != null && value >= t.badAbove) return "bad";
  if (t.badBelow != null && value <= t.badBelow) return "bad";
  if (t.warnAbove != null && value >= t.warnAbove) return "warn";
  if (t.warnBelow != null && value <= t.warnBelow) return "warn";
  return "ok";
}
