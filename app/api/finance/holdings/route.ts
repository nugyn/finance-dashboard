import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const holdings = await db.holding.findMany({
    orderBy: [{ assetClass: "asc" }, { ticker: "asc" }],
  });
  return NextResponse.json(holdings);
}
