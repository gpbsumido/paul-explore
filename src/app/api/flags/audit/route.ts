import { NextResponse } from "next/server";
import { loadAuditLog } from "@/lib/flags-bff";

export async function GET() {
  const { audit } = await loadAuditLog();
  return NextResponse.json({ audit });
}
