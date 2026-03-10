-- CreateTable
CREATE TABLE "MonthlySnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "etfValue" REAL NOT NULL DEFAULT 0,
    "etfGain" REAL NOT NULL DEFAULT 0,
    "etfContrib" REAL NOT NULL DEFAULT 0,
    "sharesValue" REAL NOT NULL DEFAULT 0,
    "sharesGain" REAL NOT NULL DEFAULT 0,
    "cryptoValue" REAL NOT NULL DEFAULT 0,
    "cryptoGain" REAL NOT NULL DEFAULT 0,
    "cashValue" REAL NOT NULL DEFAULT 0,
    "cashGain" REAL NOT NULL DEFAULT 0,
    "cashSavingsRate" REAL NOT NULL DEFAULT 0,
    "cashMonthlySpend" REAL NOT NULL DEFAULT 0,
    "cashNotes" TEXT,
    "superValue" REAL NOT NULL DEFAULT 0,
    "superVolContrib" REAL NOT NULL DEFAULT 0,
    "superGain" REAL NOT NULL DEFAULT 0,
    "mfValue" REAL NOT NULL DEFAULT 0,
    "mfGain" REAL NOT NULL DEFAULT 0,
    "otherValue" REAL NOT NULL DEFAULT 0,
    "otherGain" REAL NOT NULL DEFAULT 0,
    "propertyValue" REAL NOT NULL DEFAULT 0,
    "propertyPurchase" REAL NOT NULL DEFAULT 0,
    "propertyEquity" REAL NOT NULL DEFAULT 0,
    "propertyGain" REAL NOT NULL DEFAULT 0,
    "mortgageBalance" REAL NOT NULL DEFAULT 0,
    "mortgageInterest" REAL NOT NULL DEFAULT 0,
    "mortgagePrincipal" REAL NOT NULL DEFAULT 0,
    "liabilitiesTotal" REAL NOT NULL DEFAULT 0,
    "liabilitiesPaid" REAL NOT NULL DEFAULT 0,
    "salaryMonthly" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "AssetTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assetClass" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT,
    "date" DATETIME NOT NULL,
    "units" REAL NOT NULL,
    "price" REAL NOT NULL,
    "brokerage" REAL NOT NULL DEFAULT 0,
    "orderValue" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Holding" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assetClass" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT,
    "heldUnits" REAL NOT NULL,
    "avePrice" REAL NOT NULL,
    "currentValue" REAL NOT NULL,
    "totalReturn" REAL NOT NULL,
    "returnPct" REAL NOT NULL,
    "targetAlloc" REAL NOT NULL DEFAULT 0,
    "mgmtFee" REAL
);

-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "bankAccount" TEXT,
    "monthlyAmt" REAL NOT NULL,
    "yearlyAmt" REAL NOT NULL,
    "allocation" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "BudgetSummary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "monthlyIncome" REAL NOT NULL,
    "annualIncome" REAL NOT NULL,
    "savingsRate" REAL NOT NULL,
    "plannedSpend" REAL NOT NULL,
    "actualSpend6m" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "DebtAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "startDate" DATETIME,
    "interestRate" REAL NOT NULL DEFAULT 0,
    "startBalance" REAL NOT NULL,
    "currentBalance" REAL NOT NULL,
    "paid" REAL NOT NULL,
    "monthlyPayment" REAL NOT NULL DEFAULT 0,
    "estimatedFinal" DATETIME
);

-- CreateTable
CREATE TABLE "CashAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "balance" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "SideIncomeEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "sideIncome" REAL NOT NULL DEFAULT 0,
    "rentalIncome" REAL NOT NULL DEFAULT 0,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "DividendEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paymentDate" DATETIME NOT NULL,
    "ticker" TEXT NOT NULL,
    "holdingType" TEXT NOT NULL,
    "netAmount" REAL NOT NULL,
    "fyYear" TEXT
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlySnapshot_date_key" ON "MonthlySnapshot"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Holding_ticker_key" ON "Holding"("ticker");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_key_key" ON "UserSettings"("key");
