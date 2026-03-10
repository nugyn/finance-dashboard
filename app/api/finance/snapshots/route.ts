import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const snapshots = await db.monthlySnapshot.findMany({
    orderBy: { date: "asc" },
  });
  return NextResponse.json(snapshots);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Record<string, unknown>;

  // Auto-set to first of current month
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const data = {
    etfValue: Number(body.etfValue ?? 0),
    etfGain: 0,
    etfContrib: 0,
    sharesValue: Number(body.sharesValue ?? 0),
    sharesGain: 0,
    cryptoValue: Number(body.cryptoValue ?? 0),
    cryptoGain: 0,
    cashValue: Number(body.cashValue ?? 0),
    cashGain: 0,
    cashSavingsRate: Number(body.cashSavingsRate ?? 0),
    cashMonthlySpend: Number(body.cashMonthlySpend ?? 0),
    cashNotes: body.cashNotes ? String(body.cashNotes) : null,
    superValue: Number(body.superValue ?? 0),
    superVolContrib: Number(body.superVolContrib ?? 0),
    superGain: 0,
    mfValue: Number(body.mfValue ?? 0),
    mfGain: 0,
    otherValue: 0,
    otherGain: 0,
    propertyValue: Number(body.propertyValue ?? 0),
    propertyPurchase: 0,
    propertyEquity: 0,
    propertyGain: 0,
    mortgageBalance: Number(body.mortgageBalance ?? 0),
    mortgageInterest: 0,
    mortgagePrincipal: 0,
    liabilitiesTotal: Number(body.liabilitiesTotal ?? 0),
    liabilitiesPaid: 0,
    salaryMonthly: 0,
  };

  const snapshot = await db.monthlySnapshot.upsert({
    where: { date: firstOfMonth },
    update: data,
    create: { date: firstOfMonth, ...data },
  });

  return NextResponse.json(snapshot);
}
