import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const latest = await db.monthlySnapshot.findFirst({
    orderBy: { date: "desc" },
  });

  if (!latest) {
    return NextResponse.json({ netWorth: 0, totalAssets: 0, totalLiabilities: 0 });
  }

  const totalAssets =
    latest.etfValue +
    latest.sharesValue +
    latest.cryptoValue +
    latest.cashValue +
    latest.superValue +
    latest.mfValue +
    latest.otherValue +
    latest.propertyValue;

  const totalLiabilities = latest.liabilitiesTotal + latest.mortgageBalance;
  const netWorth = totalAssets + totalLiabilities;

  return NextResponse.json({
    netWorth,
    totalAssets,
    totalLiabilities,
    date: latest.date,
    breakdown: {
      etf: latest.etfValue,
      shares: latest.sharesValue,
      crypto: latest.cryptoValue,
      cash: latest.cashValue,
      super: latest.superValue,
      managedFunds: latest.mfValue,
      other: latest.otherValue,
      property: latest.propertyValue,
      nonMortgageDebt: latest.liabilitiesTotal,
      mortgage: latest.mortgageBalance,
    },
  });
}
