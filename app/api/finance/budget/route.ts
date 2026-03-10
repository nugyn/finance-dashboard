import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [summary, items] = await Promise.all([
    db.budgetSummary.findFirst(),
    db.budgetItem.findMany({ orderBy: { category: "asc" } }),
  ]);
  return NextResponse.json({ summary, items });
}
