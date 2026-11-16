import { NextResponse } from "next/server";
import { checkEligibility, NotEligibleException } from "@/lib/models";

export async function POST(req) {
  try {
    const { student, drive } = await req.json();
    checkEligibility(student, drive);
    return NextResponse.json({ eligible: true, reasons: [] });
  } catch (e) {
    if (e instanceof NotEligibleException)
      return NextResponse.json({ eligible: false, reasons: e.reasons });
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
