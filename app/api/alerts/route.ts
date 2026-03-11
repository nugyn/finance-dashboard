import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const alerts = await db.alert.findMany({
      include: { indicator: { select: { key: true, label: true, unit: true } } },
      orderBy: { sentAt: "desc" },
      take: 50,
    });

    return NextResponse.json(alerts);
  } catch (err) {
    console.error("GET /api/alerts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
