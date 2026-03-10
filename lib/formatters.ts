export const fmt = (n: number) =>
  n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

export const fmtN = (n: number) =>
  n.toLocaleString("en-AU", { maximumFractionDigits: 0 });

export const fmtPct = (n: number) =>
  `${(n * 100).toFixed(1)}%`;

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-AU", { month: "short", year: "numeric" });
