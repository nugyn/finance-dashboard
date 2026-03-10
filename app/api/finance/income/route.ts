import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [sideIncome, dividends] = await Promise.all([
    db.sideIncomeEntry.findMany({ orderBy: { date: "asc" } }),
    db.dividendEntry.findMany({ orderBy: { paymentDate: "desc" } }),
  ]);
  return NextResponse.json({ sideIncome, dividends });
}
