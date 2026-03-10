import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const debts = await db.debtAccount.findMany({
    orderBy: { currentBalance: "asc" },
  });
  return NextResponse.json(debts);
}
