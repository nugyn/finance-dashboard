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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const body = await req.json();

    const fields = ["warnAbove", "badAbove", "warnBelow", "badBelow"] as const;
    const data: Record<string, number | null> = {};

    for (const field of fields) {
      if (field in body) {
        const val = body[field];
        if (val === null || val === "" || val === undefined) {
          data[field] = null;
        } else {
          const num = Number(val);
          if (isNaN(num)) {
            return NextResponse.json(
              { error: `Invalid value for ${field}: must be a number or null` },
              { status: 400 }
            );
          }
          data[field] = num;
        }
      }
    }

    const indicator = await db.indicator.update({
      where: { key },
      data,
    });

    return NextResponse.json(indicator);
  } catch (err) {
    console.error("PUT /api/indicators/[key] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
