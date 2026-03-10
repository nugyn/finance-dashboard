import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const indicator = await db.indicator.findUnique({
      where: { key },
      include: {
        snapshots: {
          orderBy: { fetchedAt: "desc" },
          take: 12,
        },
      },
    });

    if (!indicator) {
      return NextResponse.json({ error: "Indicator not found" }, { status: 404 });
    }

    return NextResponse.json(indicator);
  } catch (err) {
    console.error("GET /api/indicators/[key] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
