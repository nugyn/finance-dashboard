"use client";

import { useState, useMemo } from "react";
import { fmt } from "@/lib/formatters";
import { Section } from "@/components/shared/Section";
import { Row } from "@/components/shared/Row";
import { Slider } from "@/components/shared/Slider";

export default function PropertyCalculator() {
  const [address, setAddress] = useState("15 Vaina St, Werribee");
  const [propertyValue, setPropertyValue] = useState(680000);
  const [loanBalance, setLoanBalance] = useState(475000);
  const [monthlyRent, setMonthlyRent] = useState(1800);
  const [interestRate, setInterestRate] = useState(5.96);
  const [growthRate, setGrowthRate] = useState(8.0);
  const [holdMonths, setHoldMonths] = useState(24);
  const [taxBracket, setTaxBracket] = useState(37);
  const [councilRates, setCouncilRates] = useState(1400);
  const [insurance, setInsurance] = useState(1300);
  const [pmFees, setPmFees] = useState(130);
  const [renovationCost, setRenovationCost] = useState(12000);
  const [renovationLift, setRenovationLift] = useState(28000);
  const [tab, setTab] = useState("overview");

  const calc = useMemo(() => {
    // Mortgage calc P&I 30yr
    const r = interestRate / 100 / 12;
    const n = 360;
    const monthlyRepayment = (loanBalance * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);

    // Monthly interest (deductible)
    const monthlyInterest = loanBalance * r;
    const monthlyPrincipal = monthlyRepayment - monthlyInterest;

    // Monthly expenses
    const monthlyRates = councilRates / 12;
    const monthlyInsurance = insurance / 12;
    const grossShortfall =
      monthlyRepayment + monthlyRates + monthlyInsurance + pmFees - monthlyRent;

    // Tax deductible loss
    const annualDeductible =
      (monthlyInterest + monthlyRates + monthlyInsurance / 12 + pmFees) * 12;
    const annualRentalIncome = monthlyRent * 12;
    const annualLoss = Math.max(0, annualDeductible - annualRentalIncome);
    const annualTaxBenefit = annualLoss * (taxBracket / 100);
    const monthlyTaxBenefit = annualTaxBenefit / 12;
    const netMonthly = grossShortfall - monthlyTaxBenefit;

    // Selling now
    const sellingCostsNow = propertyValue * 0.021 + 7000 + 1500 + 500;
    const cashNow = propertyValue - sellingCostsNow - loanBalance;

    // Future value
    const futureValue =
      propertyValue * Math.pow(1 + growthRate / 100 / 12, holdMonths) + renovationLift;
    const futureLoan = loanBalance - monthlyPrincipal * holdMonths;
    const futureSellingCosts = futureValue * 0.021 + 7000 + 1500 + 500;
    const cashFuture = futureValue - futureSellingCosts - futureLoan - renovationCost;

    // Real benefit
    const holdingCost = netMonthly * holdMonths;
    const realBenefit = cashFuture - cashNow - holdingCost;

    // Equity
    const equityNow = propertyValue - loanBalance;
    const equityFuture = futureValue - futureLoan;

    // Monthly equity gain
    const monthlyGrowth = propertyValue * (growthRate / 100 / 12);
    const monthlyEquityGain = monthlyGrowth + monthlyPrincipal;
    const netMonthlyGain = monthlyEquityGain - netMonthly;

    // Scenarios
    const scenarios = [
      { label: "Bear (-5%/yr)", growth: -5 },
      { label: "Flat (0%)", growth: 0 },
      { label: "Moderate (4%)", growth: 4 },
      { label: "Base (8%)", growth: 8 },
      { label: "Strong (9.4%)", growth: 9.4 },
    ].map((s) => {
      const fv =
        propertyValue * Math.pow(1 + s.growth / 100 / 12, holdMonths) + renovationLift;
      const fl = loanBalance - monthlyPrincipal * holdMonths;
      const sc = fv * 0.021 + 7000 + 1500 + 500;
      const cash = fv - sc - fl - renovationCost;
      return { ...s, futureValue: fv, cash, gain: cash - cashNow };
    });

    return {
      monthlyRepayment,
      monthlyInterest,
      monthlyPrincipal,
      grossShortfall,
      netMonthly,
      monthlyTaxBenefit,
      annualLoss,
      annualTaxBenefit,
      cashNow,
      cashFuture,
      futureValue,
      futureLoan,
      realBenefit,
      holdingCost,
      equityNow,
      equityFuture,
      monthlyEquityGain,
      netMonthlyGain,
      scenarios,
      sellingCostsNow,
      futureSellingCosts,
    };
  }, [
    propertyValue,
    loanBalance,
    monthlyRent,
    interestRate,
    growthRate,
    holdMonths,
    taxBracket,
    councilRates,
    insurance,
    pmFees,
    renovationCost,
    renovationLift,
  ]);

  const tabs = ["overview", "cashflow", "scenarios", "inputs"];

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="text-lg font-bold text-white bg-transparent border-b border-transparent hover:border-gray-600 focus:border-indigo-400 outline-none w-full transition-colors"
        />
        <p className="text-xs text-gray-400">
          Investment Property Calculator — Updated{" "}
          {new Date().toLocaleDateString("en-AU")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-800 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-xs py-1.5 rounded capitalize font-medium transition-all ${
              tab === t ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div>
          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: "Equity Today", value: fmt(calc.equityNow), color: "text-white" },
              {
                label: `Equity in ${holdMonths}mo`,
                value: fmt(calc.equityFuture),
                color: "text-emerald-400",
              },
              {
                label: "Cash if Sell Now",
                value: fmt(calc.cashNow),
                color: "text-yellow-400",
              },
              {
                label: `Cash in ${holdMonths}mo`,
                value: fmt(calc.cashFuture),
                color: "text-emerald-400",
              },
              {
                label: "Real Benefit of Holding",
                value: fmt(calc.realBenefit),
                color: calc.realBenefit > 0 ? "text-emerald-400" : "text-red-400",
              },
              {
                label: "Net Monthly Cost",
                value: fmt(calc.netMonthly),
                color: "text-orange-400",
              },
            ].map((m) => (
              <div key={m.label} className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">{m.label}</p>
                <p className={`text-lg font-bold font-mono ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Equity bar */}
          <Section title="Equity Visualisation">
            {[
              {
                label: "Today",
                property: propertyValue,
                loan: loanBalance,
                equity: calc.equityNow,
              },
              {
                label: `In ${holdMonths} months`,
                property: calc.futureValue,
                loan: calc.futureLoan,
                equity: calc.equityFuture,
              },
            ].map((b) => (
              <div key={b.label} className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>
                    {b.label} — {fmt(b.property)}
                  </span>
                  <span className="text-emerald-400">Your equity: {fmt(b.equity)}</span>
                </div>
                <div className="flex h-8 rounded overflow-hidden">
                  <div
                    className="bg-red-900 flex items-center justify-center text-xs font-mono"
                    style={{ width: `${(b.loan / b.property) * 100}%` }}
                  >
                    {fmt(b.loan)}
                  </div>
                  <div className="bg-emerald-700 flex items-center justify-center text-xs font-mono flex-1">
                    {fmt(b.equity)}
                  </div>
                </div>
                <div className="flex text-xs mt-0.5">
                  <span className="text-red-400 mr-4">■ Bank loan</span>
                  <span className="text-emerald-400">■ Your equity</span>
                </div>
              </div>
            ))}
          </Section>

          {/* Monthly equation */}
          <Section title="The Monthly Equation">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-300">You pay (net after tax)</span>
                <span className="text-orange-400 font-mono font-bold">
                  {fmt(calc.netMonthly)}/mo
                </span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-300">
                  Equity gained (growth + principal)
                </span>
                <span className="text-emerald-400 font-mono font-bold">
                  +{fmt(calc.monthlyEquityGain)}/mo
                </span>
              </div>
              <div className="border-t border-gray-600 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">Net monthly position</span>
                  <span
                    className={`font-mono font-bold text-lg ${
                      calc.netMonthlyGain > 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {calc.netMonthlyGain > 0 ? "+" : ""}
                    {fmt(calc.netMonthlyGain)}/mo
                  </span>
                </div>
              </div>
            </div>
          </Section>

          {/* Quick sliders */}
          <Section title="Quick Adjust">
            <Slider
              label="Hold Period"
              value={holdMonths}
              min={6}
              max={48}
              step={1}
              onChange={setHoldMonths}
              format={(v) => `${v} months`}
            />
            <Slider
              label="Growth Rate"
              value={growthRate}
              min={-5}
              max={15}
              step={0.5}
              onChange={setGrowthRate}
              format={(v) => `${v}%/yr`}
              sub="Werribee 2026 YTD: 9.4%"
            />
          </Section>
        </div>
      )}

      {/* CASHFLOW TAB */}
      {tab === "cashflow" && (
        <div>
          <Section title="Monthly Income & Expenses">
            <Row label="Rental income" value={fmt(monthlyRent)} />
            <Row label="Mortgage P&I" value={`-${fmt(calc.monthlyRepayment)}`} />
            <Row
              label="  ↳ Interest (deductible)"
              value={`${fmt(calc.monthlyInterest)}`}
              sub="per month"
            />
            <Row
              label="  ↳ Principal (not deductible)"
              value={`${fmt(calc.monthlyPrincipal)}`}
              sub="per month"
            />
            <Row label="Council rates" value={`-${fmt(councilRates / 12)}`} />
            <Row label="Insurance" value={`-${fmt(insurance / 12)}`} />
            <Row label="Property management" value={`-${fmt(pmFees)}`} />
            <Row label="Gross monthly shortfall" value={fmt(calc.grossShortfall)} />
          </Section>

          <Section title="Tax Benefit (Negative Gearing)">
            <Row label="Annual rental loss (deductible)" value={fmt(calc.annualLoss)} />
            <Row label="Tax bracket" value={`${taxBracket}%`} />
            <Row label="Annual tax benefit" value={fmt(calc.annualTaxBenefit)} />
            <Row label="Monthly tax benefit" value={fmt(calc.monthlyTaxBenefit)} highlight />
          </Section>

          <Section title="Real Out of Pocket">
            <Row label="Gross shortfall" value={fmt(calc.grossShortfall)} />
            <Row label="Less tax benefit" value={`-${fmt(calc.monthlyTaxBenefit)}`} />
            <Row label="Net monthly cost" value={fmt(calc.netMonthly)} highlight />
            <Row
              label={`Total over ${holdMonths} months`}
              value={fmt(calc.holdingCost)}
            />
          </Section>

          <Section title="Adjust Expenses">
            <Slider
              label="Monthly Rent"
              value={monthlyRent}
              min={1500}
              max={2500}
              step={10}
              onChange={setMonthlyRent}
              format={fmt}
              sub="Market rate $1,993/mo"
            />
            <Slider
              label="PM Fees"
              value={pmFees}
              min={80}
              max={250}
              step={5}
              onChange={setPmFees}
              format={fmt}
            />
            <Slider
              label="Council Rates (annual)"
              value={councilRates}
              min={800}
              max={2500}
              step={50}
              onChange={setCouncilRates}
              format={fmt}
            />
            <Slider
              label="Insurance (annual)"
              value={insurance}
              min={800}
              max={3000}
              step={50}
              onChange={setInsurance}
              format={fmt}
            />
            <Slider
              label="Tax Bracket"
              value={taxBracket}
              min={19}
              max={47}
              step={4.5}
              onChange={setTaxBracket}
              format={(v) => `${v}%`}
            />
          </Section>
        </div>
      )}

      {/* SCENARIOS TAB */}
      {tab === "scenarios" && (
        <div>
          <Section title="Growth Scenarios at Exit">
            <div className="space-y-3">
              {calc.scenarios.map((s) => (
                <div
                  key={s.label}
                  className={`bg-gray-800 rounded-lg p-3 ${
                    s.growth === Math.round(growthRate) ? "ring-1 ring-indigo-500" : ""
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{s.label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-mono ${
                        s.gain > 0
                          ? "bg-emerald-900 text-emerald-400"
                          : "bg-red-900 text-red-400"
                      }`}
                    >
                      {s.gain > 0 ? "+" : ""}
                      {fmt(s.gain)} vs selling now
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>
                      Value:{" "}
                      <span className="text-white font-mono">{fmt(s.futureValue)}</span>
                    </span>
                    <span>
                      Cash: <span className="text-white font-mono">{fmt(s.cash)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Renovation Analysis">
            <Slider
              label="Renovation Spend"
              value={renovationCost}
              min={0}
              max={60000}
              step={500}
              onChange={setRenovationCost}
              format={fmt}
              sub="Cosmetic kitchen+bath ~$10k-$15k"
            />
            <Slider
              label="Estimated Sale Price Lift"
              value={renovationLift}
              min={0}
              max={80000}
              step={1000}
              onChange={setRenovationLift}
              format={fmt}
              sub="Comparable gap $60k-$160k in suburb"
            />
            {renovationCost > 0 && (
              <div className="bg-gray-800 rounded-lg p-3 mt-2">
                <Row label="Renovation spend" value={`-${fmt(renovationCost)}`} />
                <Row label="Sale price lift" value={`+${fmt(renovationLift)}`} />
                <Row
                  label="Net renovation ROI"
                  value={fmt(renovationLift - renovationCost)}
                  highlight
                />
                <Row
                  label="Return on spend"
                  value={
                    renovationCost > 0
                      ? `${((renovationLift / renovationCost) * 100).toFixed(0)}%`
                      : "—"
                  }
                />
              </div>
            )}
          </Section>

          <Section title="Sell Now vs Hold Comparison">
            <Row label="Cash if sell today" value={fmt(calc.cashNow)} />
            <Row label={`Cash in ${holdMonths} months`} value={fmt(calc.cashFuture)} />
            <Row
              label="Additional cash from holding"
              value={fmt(calc.cashFuture - calc.cashNow)}
            />
            <Row
              label={`Holding costs (${holdMonths} months)`}
              value={`-${fmt(calc.holdingCost)}`}
            />
            <Row label="Real net benefit of holding" value={fmt(calc.realBenefit)} highlight />
          </Section>
        </div>
      )}

      {/* INPUTS TAB */}
      {tab === "inputs" && (
        <div>
          <Section title="Property">
            <Slider
              label="Current Property Value"
              value={propertyValue}
              min={500000}
              max={900000}
              step={5000}
              onChange={setPropertyValue}
              format={fmt}
            />
            <Slider
              label="Loan Balance"
              value={loanBalance}
              min={200000}
              max={600000}
              step={5000}
              onChange={setLoanBalance}
              format={fmt}
            />
            <Slider
              label="Interest Rate"
              value={interestRate}
              min={3}
              max={10}
              step={0.05}
              onChange={setInterestRate}
              format={(v) => `${v}%`}
              sub="Current variable: 5.96%"
            />
          </Section>

          <Section title="Assumptions">
            <Slider
              label="Annual Growth Rate"
              value={growthRate}
              min={-5}
              max={15}
              step={0.5}
              onChange={setGrowthRate}
              format={(v) => `${v}%`}
              sub="Werribee 2026 YTD: 9.4%"
            />
            <Slider
              label="Hold Period"
              value={holdMonths}
              min={6}
              max={60}
              step={1}
              onChange={setHoldMonths}
              format={(v) => `${v} months`}
            />
            <Slider
              label="Tax Bracket"
              value={taxBracket}
              min={19}
              max={47}
              step={4.5}
              onChange={setTaxBracket}
              format={(v) => `${v}%`}
            />
          </Section>

          <Section title="Key Numbers Summary">
            <Row label="Property value" value={fmt(propertyValue)} />
            <Row label="Loan balance" value={fmt(loanBalance)} />
            <Row label="Your equity" value={fmt(calc.equityNow)} highlight />
            <Row label="Monthly repayment" value={fmt(calc.monthlyRepayment)} />
            <Row label="Monthly interest" value={fmt(calc.monthlyInterest)} />
            <Row label="Monthly principal" value={fmt(calc.monthlyPrincipal)} />
            <Row label="Net monthly cost (after tax)" value={fmt(calc.netMonthly)} />
            <Row label="Cash if sell today" value={fmt(calc.cashNow)} />
            <Row
              label={`Cash in ${holdMonths} months`}
              value={fmt(calc.cashFuture)}
              highlight
            />
          </Section>
        </div>
      )}

      <p className="text-xs text-gray-600 text-center mt-6">
        For reference only. Not financial advice. Consult your accountant before making
        decisions.
      </p>
    </div>
  );
}
