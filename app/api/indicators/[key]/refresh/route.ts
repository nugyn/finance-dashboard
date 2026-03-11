import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { FETCHERS } from "@/lib/fetchers";
import { evaluateSignal } from "@/lib/signals";
import { checkAndAlert } from "@/lib/alerts";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const indicator = await db.indicator.findUnique({ where: { key } });
    if (!indicator) {
      return NextResponse.json({ error: "Indicator not found" }, { status: 404 });
    }

    const fetcher = FETCHERS[key];
    if (!fetcher) {
      return NextResponse.json({ error: `No fetcher registered for key: ${key}` }, { status: 422 });
    }

    const { value, rawText } = await fetcher();
    const signal = evaluateSignal(value, indicator);

    const snapshot = await db.snapshot.create({
      data: {
        indicatorId: indicator.id,
        value,
        rawText,
        signal,
      },
    });

    await checkAndAlert(indicator, value, signal);

    return NextResponse.json({ snapshot, signal });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/indicators/[key]/refresh error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
