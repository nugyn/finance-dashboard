import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const indicators = await db.indicator.findMany({
      include: {
        snapshots: {
          orderBy: { fetchedAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ category: "asc" }, { label: "asc" }],
    });

    const result = indicators.map((ind) => ({
      id: ind.id,
      key: ind.key,
      label: ind.label,
      category: ind.category,
      unit: ind.unit,
      sourceUrl: ind.sourceUrl,
      thresholds: {
        warnAbove: ind.warnAbove,
        badAbove: ind.badAbove,
        warnBelow: ind.warnBelow,
        badBelow: ind.badBelow,
      },
      latest: ind.snapshots[0] ?? null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/indicators error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
