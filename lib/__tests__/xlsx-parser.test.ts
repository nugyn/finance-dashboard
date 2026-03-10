import { describe, it, expect, beforeAll } from "vitest";
import * as XLSX from "xlsx";
import path from "path";
import {
  excelDateToJs,
  parseHistorySheet,
  parseCashSheet,
  parseETFSheet,
  parseDebtSheet,
  parseBudgetSheet,
  parseSideIncomeSheet,
  parseDividendSheet,
  parseUserSettings,
} from "../xlsx-parser";

const XLSX_PATH = path.join(
  process.env.HOME || "/home/duy",
  "Downloads",
  "Linh's Compiled Finance - Master v2 (as of 2026).xlsx"
);

let wb: XLSX.WorkBook;

beforeAll(() => {
  wb = XLSX.readFile(XLSX_PATH);
});

// ---------------------------------------------------------------------------
// excelDateToJs
// ---------------------------------------------------------------------------
describe("excelDateToJs", () => {
  it("converts serial 46112 to 2026-03-31", () => {
    const d = excelDateToJs(46112);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2); // 0-indexed → March
    expect(d.getDate()).toBe(31);
  });

  it("converts serial 45868 to 2025-07-30", () => {
    const d = excelDateToJs(45868);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(6); // July
    expect(d.getDate()).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// parseHistorySheet
// ---------------------------------------------------------------------------
describe("parseHistorySheet", () => {
  it("returns 9 snapshots", () => {
    const snapshots = parseHistorySheet(wb.Sheets["History"]);
    expect(snapshots.length).toBe(9);
  });

  it("latest snapshot has etfValue=10862.05", () => {
    const snapshots = parseHistorySheet(wb.Sheets["History"]);
    const latest = snapshots[snapshots.length - 1];
    expect(latest.etfValue).toBeCloseTo(10862.05, 1);
  });

  it("latest snapshot date is 2026-03-31", () => {
    const snapshots = parseHistorySheet(wb.Sheets["History"]);
    const latest = snapshots[snapshots.length - 1];
    expect(latest.date.getFullYear()).toBe(2026);
    expect(latest.date.getMonth()).toBe(2);
    expect(latest.date.getDate()).toBe(31);
  });

  it("first snapshot has super value 48900", () => {
    const snapshots = parseHistorySheet(wb.Sheets["History"]);
    expect(snapshots[0].superValue).toBeCloseTo(48900, 0);
  });

  it("snapshots include liabilitiesTotal as negative number", () => {
    const snapshots = parseHistorySheet(wb.Sheets["History"]);
    const latest = snapshots[snapshots.length - 1];
    expect(latest.liabilitiesTotal).toBeLessThan(0);
  });
});

// ---------------------------------------------------------------------------
// parseCashSheet
// ---------------------------------------------------------------------------
describe("parseCashSheet", () => {
  it("returns at least one account with balance 5000", () => {
    const { accounts } = parseCashSheet(wb.Sheets["Cash"]);
    expect(accounts.length).toBeGreaterThan(0);
    expect(accounts[0].balance).toBeCloseTo(5000, 0);
  });

  it("returns 9 cash history records", () => {
    const { history } = parseCashSheet(wb.Sheets["Cash"]);
    expect(history.length).toBe(9);
  });

  it("has spend notes in some records", () => {
    const { history } = parseCashSheet(wb.Sheets["Cash"]);
    const withNotes = history.filter((h) => h.notes && h.notes.length > 0);
    expect(withNotes.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// parseETFSheet
// ---------------------------------------------------------------------------
describe("parseETFSheet", () => {
  it("returns 4 holdings", () => {
    const { holdings } = parseETFSheet(wb.Sheets["ETFs"]);
    expect(holdings.length).toBe(4);
  });

  it("DHHF holding has 80 units at ave price ~36.75", () => {
    const { holdings } = parseETFSheet(wb.Sheets["ETFs"]);
    const dhhf = holdings.find((h) => h.ticker.includes("DHHF"));
    expect(dhhf).toBeDefined();
    expect(dhhf!.heldUnits).toBe(80);
    expect(dhhf!.avePrice).toBeCloseTo(36.748, 2);
  });

  it("returns 5 transactions", () => {
    const { transactions } = parseETFSheet(wb.Sheets["ETFs"]);
    expect(transactions.length).toBe(5);
  });

  it("GOLD transaction has 40 units", () => {
    const { transactions } = parseETFSheet(wb.Sheets["ETFs"]);
    const gold = transactions.find((t) => t.ticker.includes("GOLD"));
    expect(gold).toBeDefined();
    expect(gold!.units).toBe(40);
  });
});

// ---------------------------------------------------------------------------
// parseDebtSheet
// ---------------------------------------------------------------------------
describe("parseDebtSheet", () => {
  it("returns 5 debt accounts", () => {
    const debts = parseDebtSheet(wb.Sheets["LiabilitiesDebts"]);
    expect(debts.length).toBe(5);
  });

  it("HELP debt has currentBalance around -38797", () => {
    const debts = parseDebtSheet(wb.Sheets["LiabilitiesDebts"]);
    const help = debts[0]; // HELP is first
    expect(help.currentBalance).toBeCloseTo(-38797, 0);
  });

  it("Credit Card has currentBalance around -539", () => {
    const debts = parseDebtSheet(wb.Sheets["LiabilitiesDebts"]);
    const cc = debts[1];
    expect(cc.currentBalance).toBeCloseTo(-539, 0);
  });
});

// ---------------------------------------------------------------------------
// parseBudgetSheet
// ---------------------------------------------------------------------------
describe("parseBudgetSheet", () => {
  it("summary has monthlyIncome around 8711", () => {
    const { summary } = parseBudgetSheet(wb.Sheets["Budget"]);
    expect(summary.monthlyIncome).toBeCloseTo(8711, 0);
  });

  it("returns at least 10 budget items", () => {
    const { items } = parseBudgetSheet(wb.Sheets["Budget"]);
    expect(items.length).toBeGreaterThanOrEqual(10);
  });

  it("mortgage is in budget items with ~2826/mo", () => {
    const { items } = parseBudgetSheet(wb.Sheets["Budget"]);
    const mortgage = items.find((i) => i.name.toLowerCase().includes("mortgage"));
    expect(mortgage).toBeDefined();
    expect(mortgage!.monthlyAmt).toBeCloseTo(2826, 0);
  });
});

// ---------------------------------------------------------------------------
// parseSideIncomeSheet
// ---------------------------------------------------------------------------
describe("parseSideIncomeSheet", () => {
  it("returns 9 side income entries", () => {
    const entries = parseSideIncomeSheet(wb.Sheets["Side Income"]);
    expect(entries.length).toBe(9);
  });

  it("first entry has rentalIncome 1700", () => {
    const entries = parseSideIncomeSheet(wb.Sheets["Side Income"]);
    expect(entries[0].rentalIncome).toBeCloseTo(1700, 0);
  });
});

// ---------------------------------------------------------------------------
// parseDividendSheet
// ---------------------------------------------------------------------------
describe("parseDividendSheet", () => {
  it("returns at least 1 dividend entry", () => {
    const divs = parseDividendSheet(wb.Sheets["Dividends"]);
    expect(divs.length).toBeGreaterThanOrEqual(1);
  });

  it("first entry is VGS ETF with netAmount 10", () => {
    const divs = parseDividendSheet(wb.Sheets["Dividends"]);
    expect(divs[0].ticker).toBe("VGS");
    expect(divs[0].netAmount).toBeCloseTo(10, 0);
    expect(divs[0].holdingType).toBe("ETF");
  });
});

// ---------------------------------------------------------------------------
// parseUserSettings
// ---------------------------------------------------------------------------
describe("parseUserSettings", () => {
  it("returns employment salary = 140000", () => {
    const settings = parseUserSettings(wb.Sheets["SheetOptions"]);
    const salary = settings.find((s) => s.key === "employmentSalary");
    expect(salary).toBeDefined();
    expect(Number(salary!.value)).toBeCloseTo(140000, 0);
  });

  it("returns tax bracket = 0.35", () => {
    const settings = parseUserSettings(wb.Sheets["SheetOptions"]);
    const tax = settings.find((s) => s.key === "taxBracket");
    expect(tax).toBeDefined();
    expect(Number(tax!.value)).toBeCloseTo(0.35, 2);
  });

  it("does NOT include CoinMarketCap API key", () => {
    const settings = parseUserSettings(wb.Sheets["SheetOptions"]);
    const apiKey = settings.find(
      (s) => s.key === "coinMarketCapApiKey" || s.value.match(/^[a-f0-9-]{36}$/)
    );
    expect(apiKey).toBeUndefined();
  });
});
