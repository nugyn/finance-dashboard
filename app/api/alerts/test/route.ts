import { NextResponse } from "next/server";
import { sendWeeklyDigest } from "@/lib/alerts";

export async function POST() {
  try {
    await sendWeeklyDigest();
    return NextResponse.json({ ok: true, message: "Test digest sent (check SMTP config)" });
  } catch (err) {
    console.error("POST /api/alerts/test error:", err);
    return NextResponse.json({ error: "Failed to send test digest" }, { status: 500 });
  }
}
