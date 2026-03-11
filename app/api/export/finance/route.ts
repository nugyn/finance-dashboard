import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const snapshots = await db.monthlySnapshot.findMany({
      orderBy: { date: "asc" },
    });

    if (snapshots.length === 0) {
      return new NextResponse("No data to export", { status: 404 });
    }

    // Use all numeric fields from the model
    const fields = Object.keys(snapshots[0]).filter(
      (k) => k !== "id" && typeof snapshots[0][k as keyof typeof snapshots[0]] !== "object"
    );

    const header = fields.join(",");
    const rows = snapshots.map((snap) =>
      fields
        .map((f) => {
          const val = snap[f as keyof typeof snap];
          if (val instanceof Date) return val.toISOString();
          if (typeof val === "string" && val.includes(",")) return `"${val}"`;
          return val ?? "";
        })
        .join(",")
    );

    return new NextResponse([header, ...rows].join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="finance-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error("GET /api/export/finance error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
