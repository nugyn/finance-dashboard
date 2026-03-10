"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  MonthlySnapshot,
  Holding,
  DebtAccount,
  BudgetItem,
  BudgetSummary,
  CashAccount,
  SideIncomeEntry,
  DividendEntry,
  AssetTransaction,
  UserSettings,
} from "@prisma/client";

import OverviewTab from "@/components/dashboard/OverviewTab";
import NetWorthTab from "@/components/dashboard/NetWorthTab";
import CashTab from "@/components/dashboard/CashTab";
import InvestmentsTab from "@/components/dashboard/InvestmentsTab";
import SuperTab from "@/components/dashboard/SuperTab";
import BudgetTab from "@/components/dashboard/BudgetTab";
import FireTab from "@/components/dashboard/FireTab";
import DebtsTab from "@/components/dashboard/DebtsTab";
import PropertyTab from "@/components/dashboard/PropertyTab";
import IncomeTab from "@/components/dashboard/IncomeTab";
import CapitalGainsTab from "@/components/dashboard/CapitalGainsTab";
import RecordNetWorthModal from "@/components/dashboard/RecordNetWorthModal";

interface Props {
  snapshots: MonthlySnapshot[];
  holdings: Holding[];
  debts: DebtAccount[];
  budgetItems: BudgetItem[];
  budgetSummary: BudgetSummary | null;
  cashAccounts: CashAccount[];
  sideIncome: SideIncomeEntry[];
  dividends: DividendEntry[];
  transactions: AssetTransaction[];
  userSettings: UserSettings[];
}

type TabId =
  | "overview"
  | "networth"
  | "cash"
  | "investments"
  | "super"
  | "budget"
  | "fire"
  | "debts"
  | "property"
  | "income"
  | "cgt";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "networth", label: "Net Worth" },
  { id: "cash", label: "Cash" },
  { id: "investments", label: "Investments" },
  { id: "super", label: "Super" },
  { id: "budget", label: "Budget" },
  { id: "fire", label: "FIRE" },
  { id: "debts", label: "Debts" },
  { id: "property", label: "Property" },
  { id: "income", label: "Income" },
  { id: "cgt", label: "Capital Gains" },
];

function getSetting(settings: UserSettings[], key: string, fallback: number): number {
  const s = settings.find((s) => s.key === key);
  return s ? Number(s.value) || fallback : fallback;
}

export default function DashboardClient({
  snapshots,
  holdings,
  debts,
  budgetItems,
  budgetSummary,
  cashAccounts,
  sideIncome,
  dividends,
  transactions,
  userSettings,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showModal, setShowModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const router = useRouter();

  const latest = snapshots[snapshots.length - 1];

  const eoyGoal = getSetting(userSettings, "eoyCargoal", 20000);
  const emergencyMonths = getSetting(userSettings, "emergencyFundDuration", 6);
  const cashBalance = cashAccounts.reduce((s, a) => s + a.balance, 0);
  const taxRate = getSetting(userSettings, "taxBracket", 0.35);

  async function handleImport() {
    setImporting(true);
    setImportMsg(null);
    try {
      const res = await fetch("/api/finance/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useDefault: true }),
      });
      const data = (await res.json()) as { imported: Record<string, number>; errors: string[] };
      const counts = Object.entries(data.imported)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      setImportMsg(`Imported — ${counts}${data.errors.length > 0 ? ` | Errors: ${data.errors.join("; ")}` : ""}`);
      router.refresh();
    } catch {
      setImportMsg("Import failed. Check server logs.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Top nav */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-6 h-14">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
            Property Calculator
          </Link>
          <Link
            href="/market-indicators"
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Market Indicators
          </Link>
          <span className="text-sm font-medium text-indigo-400 border-b-2 border-indigo-400 pb-px h-full flex items-end leading-[3.5rem]">
            Dashboard
          </span>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            >
              Record Net Worth
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="text-xs px-3 py-1.5 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400 rounded transition-colors disabled:opacity-50"
            >
              {importing ? "Importing…" : "Import xlsx"}
            </button>
          </div>
        </div>
      </div>

      {importMsg && (
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-3 py-2">
            {importMsg}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-100">Finance Dashboard</h1>
            {latest && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated:{" "}
                {new Date(latest.date).toLocaleDateString("en-AU", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex gap-1 border-b border-gray-800 overflow-x-auto pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
                activeTab === tab.id
                  ? "text-indigo-400 border-b-2 border-indigo-400 -mb-px"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {snapshots.length === 0 && activeTab !== "overview" ? (
          <div className="text-gray-500 text-sm">
            No data yet. Click{" "}
            <button onClick={handleImport} className="text-indigo-400 underline">
              Import xlsx
            </button>{" "}
            to load your CompiledSanity sheet.
          </div>
        ) : (
          <>
            {activeTab === "overview" && <OverviewTab snapshots={snapshots} />}
            {activeTab === "networth" && <NetWorthTab snapshots={snapshots} />}
            {activeTab === "cash" && (
              <CashTab
                snapshots={snapshots}
                accounts={cashAccounts}
                eoyGoal={eoyGoal}
              />
            )}
            {activeTab === "investments" && (
              <InvestmentsTab snapshots={snapshots} holdings={holdings} />
            )}
            {activeTab === "super" && snapshots.length > 0 && (
              <SuperTab snapshots={snapshots} />
            )}
            {activeTab === "budget" && (
              <BudgetTab
                summary={budgetSummary}
                items={budgetItems}
                emergencyMonths={emergencyMonths}
                cashBalance={cashBalance}
              />
            )}
            {activeTab === "fire" && snapshots.length > 0 && (
              <FireTab snapshots={snapshots} settings={userSettings} />
            )}
            {activeTab === "debts" && snapshots.length > 0 && (
              <DebtsTab
                snapshots={snapshots}
                debts={debts}
                mortgageBalance={latest.mortgageBalance}
              />
            )}
            {activeTab === "property" && snapshots.length > 0 && (
              <PropertyTab snapshots={snapshots} />
            )}
            {activeTab === "income" && (
              <IncomeTab sideIncome={sideIncome} dividends={dividends} />
            )}
            {activeTab === "cgt" && (
              <CapitalGainsTab
                transactions={transactions}
                taxRate={taxRate}
                longTermTaxRate={taxRate / 2}
              />
            )}
          </>
        )}
      </div>

      {showModal && (
        <RecordNetWorthModal
          onClose={() => setShowModal(false)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
