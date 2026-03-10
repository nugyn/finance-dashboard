import { db } from "@/lib/db";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const [snapshots, holdings, debts, budgetItems, budgetSummary, cashAccounts, sideIncome, dividends, transactions, userSettings] =
    await Promise.all([
      db.monthlySnapshot.findMany({ orderBy: { date: "asc" } }),
      db.holding.findMany({ orderBy: [{ assetClass: "asc" }, { ticker: "asc" }] }),
      db.debtAccount.findMany({ orderBy: { currentBalance: "asc" } }),
      db.budgetItem.findMany({ orderBy: { category: "asc" } }),
      db.budgetSummary.findFirst(),
      db.cashAccount.findMany(),
      db.sideIncomeEntry.findMany({ orderBy: { date: "asc" } }),
      db.dividendEntry.findMany({ orderBy: { paymentDate: "desc" } }),
      db.assetTransaction.findMany({ orderBy: { date: "asc" } }),
      db.userSettings.findMany(),
    ]);

  return (
    <DashboardClient
      snapshots={snapshots}
      holdings={holdings}
      debts={debts}
      budgetItems={budgetItems}
      budgetSummary={budgetSummary}
      cashAccounts={cashAccounts}
      sideIncome={sideIncome}
      dividends={dividends}
      transactions={transactions}
      userSettings={userSettings}
    />
  );
}
