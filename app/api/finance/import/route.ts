import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import path from "path";
import { db } from "@/lib/db";
import {
  parseHistorySheet,
  parseCashSheet,
  parseETFSheet,
  parseDebtSheet,
  parseBudgetSheet,
  parseSideIncomeSheet,
  parseDividendSheet,
  parseUserSettings,
} from "@/lib/xlsx-parser";

const DEFAULT_XLSX_PATH = path.join(
  process.env.HOME || "/home/duy",
  "Downloads",
  "Linh's Compiled Finance - Master v2 (as of 2026).xlsx"
);

export async function POST(req: NextRequest) {
  try {
    let xlsxPath = DEFAULT_XLSX_PATH;

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      // File upload — save to temp path
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const tmpPath = path.join("/tmp", `finance-import-${Date.now()}.xlsx`);
      const fsPromises = await import("fs/promises");
      await fsPromises.writeFile(tmpPath, buf);
      xlsxPath = tmpPath;
    } else {
      const body = await req.json().catch(() => ({})) as Record<string, unknown>;
      if (!body.useDefault) {
        return NextResponse.json(
          { error: "Provide useDefault:true or upload a file" },
          { status: 400 }
        );
      }
    }

    const fs = await import("fs");
    let fileBuffer: Buffer;
    try {
      fileBuffer = fs.readFileSync(xlsxPath);
    } catch {
      return NextResponse.json(
        { error: `Cannot access file ${xlsxPath}` },
        { status: 500 }
      );
    }
    const wb = XLSX.read(fileBuffer, { type: "buffer" });
    const errors: string[] = [];
    const imported: Record<string, number> = {};

    // --- History snapshots ---
    try {
      const historyRows = parseHistorySheet(wb.Sheets["History"]);
      const cashParsed = parseCashSheet(wb.Sheets["Cash"]);

      // Build cash lookup by date serial for spend/notes merge
      const cashBySerial = new Map<string, { monthlySpend: number; notes: string | null }>();
      for (const h of cashParsed.history) {
        cashBySerial.set(h.date.toISOString().split("T")[0], {
          monthlySpend: h.monthlySpend,
          notes: h.notes,
        });
      }

      let snapshotCount = 0;
      for (const row of historyRows) {
        const dateKey = row.date.toISOString().split("T")[0];
        const cashExtra = cashBySerial.get(dateKey);

        await db.monthlySnapshot.upsert({
          where: { date: row.date },
          update: {
            etfValue: row.etfValue,
            etfGain: row.etfGain,
            etfContrib: row.etfContrib,
            sharesValue: row.sharesValue,
            sharesGain: row.sharesGain,
            cryptoValue: row.cryptoValue,
            cryptoGain: row.cryptoGain,
            cashValue: row.cashValue,
            cashGain: row.cashGain,
            cashSavingsRate: row.cashSavingsRate,
            cashMonthlySpend: cashExtra?.monthlySpend ?? row.cashMonthlySpend,
            cashNotes: cashExtra?.notes ?? row.cashNotes,
            superValue: row.superValue,
            superVolContrib: row.superVolContrib,
            superGain: row.superGain,
            mfValue: row.mfValue,
            mfGain: row.mfGain,
            otherValue: row.otherValue,
            otherGain: row.otherGain,
            propertyValue: row.propertyValue,
            propertyPurchase: row.propertyPurchase,
            propertyEquity: row.propertyEquity,
            propertyGain: row.propertyGain,
            mortgageBalance: row.mortgageBalance,
            mortgageInterest: row.mortgageInterest,
            mortgagePrincipal: row.mortgagePrincipal,
            liabilitiesTotal: row.liabilitiesTotal,
            liabilitiesPaid: row.liabilitiesPaid,
            salaryMonthly: row.salaryMonthly,
          },
          create: {
            date: row.date,
            etfValue: row.etfValue,
            etfGain: row.etfGain,
            etfContrib: row.etfContrib,
            sharesValue: row.sharesValue,
            sharesGain: row.sharesGain,
            cryptoValue: row.cryptoValue,
            cryptoGain: row.cryptoGain,
            cashValue: row.cashValue,
            cashGain: row.cashGain,
            cashSavingsRate: row.cashSavingsRate,
            cashMonthlySpend: cashExtra?.monthlySpend ?? 0,
            cashNotes: cashExtra?.notes ?? null,
            superValue: row.superValue,
            superVolContrib: row.superVolContrib,
            superGain: row.superGain,
            mfValue: row.mfValue,
            mfGain: row.mfGain,
            otherValue: row.otherValue,
            otherGain: row.otherGain,
            propertyValue: row.propertyValue,
            propertyPurchase: row.propertyPurchase,
            propertyEquity: row.propertyEquity,
            propertyGain: row.propertyGain,
            mortgageBalance: row.mortgageBalance,
            mortgageInterest: row.mortgageInterest,
            mortgagePrincipal: row.mortgagePrincipal,
            liabilitiesTotal: row.liabilitiesTotal,
            liabilitiesPaid: row.liabilitiesPaid,
            salaryMonthly: row.salaryMonthly,
          },
        });
        snapshotCount++;
      }

      // --- Cash accounts ---
      await db.cashAccount.deleteMany();
      for (const acc of cashParsed.accounts) {
        await db.cashAccount.create({ data: acc });
      }
      imported.cashAccounts = cashParsed.accounts.length;
      imported.snapshots = snapshotCount;
    } catch (e) {
      errors.push(`History/Cash: ${e instanceof Error ? e.message : e}`);
    }

    // --- ETF holdings + transactions ---
    try {
      const { holdings, transactions } = parseETFSheet(wb.Sheets["ETFs"]);

      for (const h of holdings) {
        await db.holding.upsert({
          where: { ticker: h.ticker },
          update: h,
          create: h,
        });
      }
      imported.holdings = holdings.length;

      // Clear and re-import ETF transactions
      await db.assetTransaction.deleteMany({ where: { assetClass: "etf" } });
      if (transactions.length > 0) {
        await db.assetTransaction.createMany({ data: transactions });
      }
      imported.etfTransactions = transactions.length;
    } catch (e) {
      errors.push(`ETFs: ${e instanceof Error ? e.message : e}`);
    }

    // --- Debts ---
    try {
      const debts = parseDebtSheet(wb.Sheets["LiabilitiesDebts"]);
      await db.debtAccount.deleteMany();
      if (debts.length > 0) {
        await db.debtAccount.createMany({ data: debts });
      }
      imported.debts = debts.length;
    } catch (e) {
      errors.push(`Debts: ${e instanceof Error ? e.message : e}`);
    }

    // --- Budget ---
    try {
      const { summary, items } = parseBudgetSheet(wb.Sheets["Budget"]);
      await db.budgetSummary.deleteMany();
      await db.budgetItem.deleteMany();
      await db.budgetSummary.create({ data: summary });
      if (items.length > 0) {
        await db.budgetItem.createMany({ data: items });
      }
      imported.budgetItems = items.length;
    } catch (e) {
      errors.push(`Budget: ${e instanceof Error ? e.message : e}`);
    }

    // --- Side Income ---
    try {
      const entries = parseSideIncomeSheet(wb.Sheets["Side Income"]);
      await db.sideIncomeEntry.deleteMany();
      if (entries.length > 0) {
        await db.sideIncomeEntry.createMany({ data: entries });
      }
      imported.sideIncome = entries.length;
    } catch (e) {
      errors.push(`Side Income: ${e instanceof Error ? e.message : e}`);
    }

    // --- Dividends ---
    try {
      const divs = parseDividendSheet(wb.Sheets["Dividends"]);
      await db.dividendEntry.deleteMany();
      if (divs.length > 0) {
        await db.dividendEntry.createMany({ data: divs });
      }
      imported.dividends = divs.length;
    } catch (e) {
      errors.push(`Dividends: ${e instanceof Error ? e.message : e}`);
    }

    // --- User Settings ---
    try {
      const settings = parseUserSettings(wb.Sheets["SheetOptions"]);
      for (const s of settings) {
        await db.userSettings.upsert({
          where: { key: s.key },
          update: { value: s.value, category: s.category },
          create: s,
        });
      }
      imported.userSettings = settings.length;
    } catch (e) {
      errors.push(`UserSettings: ${e instanceof Error ? e.message : e}`);
    }

    return NextResponse.json({ imported, errors });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
