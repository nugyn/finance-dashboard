export const fmt = (n: number) =>
  n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

export const fmtN = (n: number) =>
  n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
