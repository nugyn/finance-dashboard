import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const annotations = await db.annotation.findMany({
      include: { indicator: { select: { key: true, label: true } } },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(annotations);
  } catch (err) {
    console.error("GET /api/annotations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, indicatorId, date } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const annotation = await db.annotation.create({
      data: {
        text,
        indicatorId: indicatorId ?? null,
        date: date ? new Date(date) : new Date(),
      },
      include: { indicator: { select: { key: true, label: true } } },
    });

    return NextResponse.json(annotation, { status: 201 });
  } catch (err) {
    console.error("POST /api/annotations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await db.annotation.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/annotations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
