import * as XLSX from "xlsx";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MonthlySnapshotData {
  date: Date;
  etfValue: number;
  etfGain: number;
  etfContrib: number;
  sharesValue: number;
  sharesGain: number;
  cryptoValue: number;
  cryptoGain: number;
  cashValue: number;
  cashGain: number;
  cashSavingsRate: number;
  cashMonthlySpend: number;
  cashNotes: string | null;
  superValue: number;
  superVolContrib: number;
  superGain: number;
  mfValue: number;
  mfGain: number;
  otherValue: number;
  otherGain: number;
  propertyValue: number;
  propertyPurchase: number;
  propertyEquity: number;
  propertyGain: number;
  mortgageBalance: number;
  mortgageInterest: number;
  mortgagePrincipal: number;
  liabilitiesTotal: number;
  liabilitiesPaid: number;
  salaryMonthly: number;
}

export interface HoldingData {
  assetClass: string;
  ticker: string;
  name: string;
  heldUnits: number;
  avePrice: number;
  currentValue: number;
  totalReturn: number;
  returnPct: number;
  targetAlloc: number;
  mgmtFee: number | null;
}

export interface TransactionData {
  assetClass: string;
  ticker: string;
  name: string;
  date: Date;
  units: number;
  price: number;
  brokerage: number;
  orderValue: number;
}

export interface BudgetItemData {
  name: string;
  category: string;
  bankAccount: string;
  monthlyAmt: number;
  yearlyAmt: number;
  allocation: number;
}

export interface BudgetSummaryData {
  monthlyIncome: number;
  annualIncome: number;
  savingsRate: number;
  plannedSpend: number;
  actualSpend6m: number;
}

export interface DebtAccountData {
  name: string;
  startDate: Date | null;
  interestRate: number;
  startBalance: number;
  currentBalance: number;
  paid: number;
  monthlyPayment: number;
  estimatedFinal: Date | null;
}

export interface CashAccountData {
  name: string;
  currency: string;
  balance: number;
}

export interface CashHistoryData {
  date: Date;
  cashValue: number;
  cashGain: number;
  savingsRate: number;
  monthlySpend: number;
  notes: string | null;
}

export interface SideIncomeData {
  date: Date;
  sideIncome: number;
  rentalIncome: number;
  notes: string | null;
}

export interface DividendData {
  paymentDate: Date;
  ticker: string;
  holdingType: string;
  netAmount: number;
  fyYear: string | null;
}

export interface UserSettingData {
  key: string;
  value: string;
  category: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert Excel date serial to JS Date.
 * Excel epoch: Jan 0 1900 (serial 1 = Jan 1 1900)
 * Unix epoch offset: serial 25569 = Jan 1 1970
 * Excel has a known bug treating 1900 as leap year, handled by the -1 offset.
 */
export function excelDateToJs(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

function n(v: unknown, fallback = 0): number {
  const num = Number(v);
  return isNaN(num) ? fallback : num;
}

function str(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function isExcelSerial(v: unknown): boolean {
  return typeof v === "number" && v > 40000 && v < 60000;
}

// ---------------------------------------------------------------------------
// parseHistorySheet
// ---------------------------------------------------------------------------
export function parseHistorySheet(ws: XLSX.WorkSheet): MonthlySnapshotData[] {
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
  });

  const results: MonthlySnapshotData[] = [];

  // Data starts at row index 2 (rows 0 and 1 are headers)
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (!isExcelSerial(r[0])) continue;

    results.push({
      date: excelDateToJs(r[0] as number),
      // Stocks: cols 1-4
      sharesValue: n(r[1]),
      sharesGain: n(r[2]),
      // ETFs: cols 5-8
      etfValue: n(r[5]),
      etfGain: n(r[6]),
      etfContrib: n(r[8]),
      // Crypto: cols 9-12
      cryptoValue: n(r[9]),
      cryptoGain: n(r[10]),
      // Cash: cols 13-15
      cashValue: n(r[13]),
      cashGain: n(r[14]),
      cashSavingsRate: n(r[15]),
      cashMonthlySpend: 0, // filled from Cash sheet merge
      cashNotes: null, // filled from Cash sheet merge
      // Super: cols 16-19
      superValue: n(r[16]),
      superVolContrib: n(r[17]),
      superGain: n(r[18]),
      // Liabilities: cols 20-21
      liabilitiesTotal: n(r[20]),
      liabilitiesPaid: n(r[21]),
      // Salary: col 22
      salaryMonthly: n(r[22]),
      // Property: cols 23-30
      propertyValue: n(r[23]),
      propertyPurchase: n(r[24]),
      propertyEquity: n(r[25]),
      propertyGain: n(r[26]),
      mortgageBalance: n(r[27]),
      mortgageInterest: n(r[28]),
      mortgagePrincipal: n(r[29]),
      // Managed Funds: cols 31-34
      mfValue: n(r[31]),
      mfGain: n(r[32]),
      // Other Assets: cols 35-36
      otherValue: n(r[35]),
      otherGain: n(r[36]),
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// parseCashSheet
// ---------------------------------------------------------------------------
export function parseCashSheet(ws: XLSX.WorkSheet): {
  accounts: CashAccountData[];
  history: CashHistoryData[];
} {
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
  });

  const accounts: CashAccountData[] = [];
  // Row 1 onwards: col 0=bank name, col 1=currency, col 2=balance
  // Collect non-null account rows (until "ℹ️ Help" marker)
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    const name = str(r[0]);
    const currency = str(r[1]);
    const balance = n(r[2]);
    if (name && name !== "ℹ️ Help" && currency && balance > 0) {
      accounts.push({ name, currency, balance });
    }
    if (name === "ℹ️ Help") break;
  }

  const history: CashHistoryData[] = [];
  // Cash history table starts at col 6 in row 1 (header), data from row 2
  // Columns: [6]=date, [7]=cashValue, [8]=cashGain, [9]=savingsRate,
  //          [10]=addedInvestments, [11]=savingsRate, [12]=monthlySavings,
  //          [13]=projectedCash, [14]=monthlySpend, [15]=spendNotes
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (!isExcelSerial(r[6])) continue;

    const monthlySpend = r[14] === "-" || r[14] == null ? 0 : n(r[14]);
    history.push({
      date: excelDateToJs(r[6] as number),
      cashValue: n(r[7]),
      cashGain: r[8] === "-" ? 0 : n(r[8]),
      savingsRate: r[11] === "-" ? 0 : n(r[11]),
      monthlySpend,
      notes: str(r[15]) || null,
    });
  }

  return { accounts, history };
}

// ---------------------------------------------------------------------------
// parseETFSheet
// ---------------------------------------------------------------------------
export function parseETFSheet(ws: XLSX.WorkSheet): {
  holdings: HoldingData[];
  transactions: TransactionData[];
} {
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
  });

  const holdings: HoldingData[] = [];
  // Holdings table: row 0 is header, rows 1+ are holdings
  // Cols: [0]=ticker, [1]=name, [2]=currency, [3]=livePrice, [4]=history,
  //       [5]=heldUnits, [6]=liveValue, [7]=totalReturn$, [8]=totalReturnPct,
  //       [9]=estReturnYr, [10]=divReturn, [11]=divYield,
  //       [12]=avePrice, [13]=currentAlloc, [14]=targetAlloc, [15]=allocDiff,
  //       [16]=mgtFee
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    const ticker = str(r[0]);
    // Stop at transaction table or summary/help section
    if (ticker.startsWith("Purchase History") || ticker.startsWith("Insert further") || ticker === "ℹ️ Help") break;
    if (!ticker) continue; // skip empty/spacer rows
    const heldUnits = n(r[5]);

    holdings.push({
      assetClass: "etf",
      ticker,
      name: str(r[1]),
      heldUnits,
      avePrice: n(r[12]),
      currentValue: n(r[6]),
      totalReturn: n(r[7]),
      returnPct: n(r[8]),
      targetAlloc: n(r[14]),
      mgmtFee: r[16] != null ? n(r[16]) : null,
    });
  }

  const transactions: TransactionData[] = [];
  // Find the transaction table header
  let txStartRow = -1;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (str(r[0]) === "Ticker" && str(r[1]) === "Order Date") {
      txStartRow = i + 1;
      break;
    }
  }

  if (txStartRow > 0) {
    for (let i = txStartRow; i < rows.length; i++) {
      const r = rows[i] as unknown[];
      const ticker = str(r[0]);
      if (!ticker) continue;

      const dateSerial = r[1];
      const date = isExcelSerial(dateSerial)
        ? excelDateToJs(dateSerial as number)
        : new Date("2020-01-01");

      transactions.push({
        assetClass: "etf",
        ticker,
        name: "",
        date,
        units: n(r[2]),
        price: n(r[3]),
        brokerage: n(r[4]),
        orderValue: n(r[6]),
      });
    }
  }

  return { holdings, transactions };
}

// ---------------------------------------------------------------------------
// parseDebtSheet
// ---------------------------------------------------------------------------
export function parseDebtSheet(ws: XLSX.WorkSheet): DebtAccountData[] {
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
  });

  // Row 10: ["Name:", "HELP Debt Example", "Credit Card 1", "Solar Debt", "Afterpay", "Personal Loan 2"]
  // Row 11: ["Loan Start Date", serial, serial, "-", null, serial]
  // Row 12: ["Interest Frequency (times/year)", ...]
  // Row 13: ["Annual Interest Rate (%)", ...]
  // Row 14: ["Your Regular Payment ($/month)", ...]
  // Row 15: ["Start Loan Balance ($)", ...]
  // Row 16: ["Current Loan Balance ($)", ...]
  // Row 17: ["Loan Payments Paid ($)", ...]
  // Row 21: ["Estimated Final Payment date", ...]

  const nameRow = rows.find((r) => str((r as unknown[])[0]) === "Name:") as unknown[];
  if (!nameRow) return [];

  const startDateRow = rows.find((r) => str((r as unknown[])[0]) === "Loan Start Date") as unknown[];
  const rateRow = rows.find((r) => str((r as unknown[])[0]) === "Annual Interest Rate (%)") as unknown[];
  const paymentRow = rows.find((r) => str((r as unknown[])[0]) === "Your Regular Payment ($/month)") as unknown[];
  const startBalRow = rows.find((r) => str((r as unknown[])[0]) === "Start Loan Balance ($)") as unknown[];
  const currBalRow = rows.find((r) => str((r as unknown[])[0]) === "Current Loan Balance ($)") as unknown[];
  const paidRow = rows.find((r) => str((r as unknown[])[0]) === "Loan Payments Paid ($)") as unknown[];
  const estFinalRow = rows.find((r) => str((r as unknown[])[0]) === "Estimated Final Payment date") as unknown[];

  const debts: DebtAccountData[] = [];

  // Debt accounts are in columns 1-5 of the name row
  for (let col = 1; col <= 5; col++) {
    const name = str(nameRow[col]);
    if (!name) continue;

    const startDateVal = startDateRow?.[col];
    const estFinalVal = estFinalRow?.[col];

    debts.push({
      name,
      startDate: isExcelSerial(startDateVal) ? excelDateToJs(startDateVal as number) : null,
      interestRate: n(rateRow?.[col]),
      startBalance: n(startBalRow?.[col]),
      currentBalance: n(currBalRow?.[col]),
      paid: n(paidRow?.[col]),
      monthlyPayment: n(paymentRow?.[col]),
      estimatedFinal: isExcelSerial(estFinalVal) ? excelDateToJs(estFinalVal as number) : null,
    });
  }

  return debts;
}

// ---------------------------------------------------------------------------
// parseBudgetSheet
// ---------------------------------------------------------------------------
export function parseBudgetSheet(ws: XLSX.WorkSheet): {
  summary: BudgetSummaryData;
  items: BudgetItemData[];
} {
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
  });

  // Row 1: ["Monthly Income: ", 8711.07, "Job Start Date:", ..., "Annual after-tax Income:", 104532.82, ...]
  // Row 3: [null, null, null, null, null, null, null, null, null, 5879, null, null, 11033.64] (planned/actual spend)
  // Row 6: ["ITEM", "% Allocation", "Monthly $", "Weekly $", "Yearly $", "Bank Account", "Category"]
  // Rows 7+: line items

  const incomeRow = rows[1] as unknown[];
  const spendRow = rows[3] as unknown[];
  const headerRow = rows.findIndex((r) => str((r as unknown[])[0]) === "ITEM");

  const summary: BudgetSummaryData = {
    monthlyIncome: n(incomeRow[1]),
    annualIncome: n(incomeRow[5]),
    savingsRate: 0,
    plannedSpend: n(spendRow?.[9]),
    actualSpend6m: n(spendRow?.[12]),
  };

  const items: BudgetItemData[] = [];

  if (headerRow >= 0) {
    for (let i = headerRow + 1; i < rows.length; i++) {
      const r = rows[i] as unknown[];
      const name = str(r[0]);
      const monthlyAmt = n(r[2]);
      const category = str(r[6]);

      // Skip empty rows and auto-rows that aren't real budget items
      if (!name) continue;
      if (name.startsWith("If adding")) continue;
      if (name.startsWith("Automatic Salary")) break;
      if (!category && monthlyAmt === 0) continue;

      items.push({
        name,
        category: category || "Uncategorised",
        bankAccount: str(r[5]),
        monthlyAmt,
        yearlyAmt: n(r[4]),
        allocation: n(r[1]),
      });
    }
  }

  return { summary, items };
}

// ---------------------------------------------------------------------------
// parseSideIncomeSheet
// ---------------------------------------------------------------------------
export function parseSideIncomeSheet(ws: XLSX.WorkSheet): SideIncomeData[] {
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
  });

  const results: SideIncomeData[] = [];

  // Data rows start at row 1 (0-indexed)
  // Cols: [4]=periodStart, [5]=periodEnd(=month), [6]=sideIncome, [7]=rentalIncome, [8]=total, [9]=notes
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    const dateSerial = r[5]; // period end = month marker
    if (!isExcelSerial(dateSerial)) continue;

    const sideIncome = r[6] == null ? 0 : n(r[6]);
    const rentalIncome = r[7] == null ? 0 : n(r[7]);

    results.push({
      date: excelDateToJs(dateSerial as number),
      sideIncome,
      rentalIncome,
      notes: str(r[9]) || null,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// parseDividendSheet
// ---------------------------------------------------------------------------
export function parseDividendSheet(ws: XLSX.WorkSheet): DividendData[] {
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
  });

  const results: DividendData[] = [];

  // Header at row 2, data from row 3
  // Cols: [0]=paymentDate, [1]=ticker, [2]=holdingType, [3]=exDiv, [4]=reinvested, [5]=netAmount
  for (let i = 3; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    const dateSerial = r[0];
    const netAmount = n(r[5]);
    const ticker = str(r[1]);

    if (!isExcelSerial(dateSerial)) continue;
    if (!ticker) continue;
    if (netAmount === 0) continue;

    results.push({
      paymentDate: excelDateToJs(dateSerial as number),
      ticker,
      holdingType: str(r[2]) || "ETF",
      netAmount,
      fyYear: null, // derive from date if needed
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// parseUserSettings
// ---------------------------------------------------------------------------

const SETTINGS_MAP: Record<number, { key: string; category: string }> = {
  4: { key: "employmentSalary", category: "General" },
  7: { key: "salaryFrequency", category: "Budget" },
  8: { key: "netRegularIncome", category: "Budget" },
  11: { key: "bankInterestRate", category: "Investments" },
  12: { key: "brokerage", category: "Investments" },
  15: { key: "assetAllocEtfs", category: "Investments" },
  16: { key: "assetAllocStocks", category: "Investments" },
  17: { key: "assetAllocCrypto", category: "Investments" },
  18: { key: "assetAllocCash", category: "Investments" },
  24: { key: "eoyCargoal", category: "Cash" },
  25: { key: "marketInvestmentReturn", category: "Investments" },
  26: { key: "taxBracket", category: "General" },
  30: { key: "emergencyFundDuration", category: "Budget" },
};

export function parseUserSettings(ws: XLSX.WorkSheet): UserSettingData[] {
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
  });

  const results: UserSettingData[] = [];

  // Settings table: cols 10-15 with ID in col 15
  // Row structure: [10]=setting, [11]=value, [12]=category, [13]=note, [14]=null, [15]=id
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    const id = n(r[15]);
    if (id === 0) continue;

    const mapping = SETTINGS_MAP[id];
    if (!mapping) continue;

    // Skip CoinMarketCap API key (ID 29) — sensitive credential
    if (id === 29) continue;

    const value = r[11];
    if (value == null) continue;

    results.push({
      key: mapping.key,
      value: String(value),
      category: mapping.category,
    });
  }

  return results;
}
