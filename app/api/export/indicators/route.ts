import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const indicators = await db.indicator.findMany({
      include: {
        snapshots: { orderBy: { fetchedAt: "desc" } },
      },
      orderBy: [{ category: "asc" }, { label: "asc" }],
    });

    const rows: string[] = [
      "Indicator,Category,Unit,Date,Value,Signal",
    ];

    for (const ind of indicators) {
      for (const snap of ind.snapshots) {
        rows.push(
          [
            `"${ind.label}"`,
            ind.category,
            ind.unit ?? "",
            new Date(snap.fetchedAt).toISOString(),
            snap.value,
            snap.signal,
          ].join(",")
        );
      }
    }

    return new NextResponse(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="indicators-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error("GET /api/export/indicators error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
