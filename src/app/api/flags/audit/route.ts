import { NextResponse } from "next/server";
import { getAudit } from "@/lib/flags-data";

export async function GET() {
  return NextResponse.json({ audit: getAudit() });
}
