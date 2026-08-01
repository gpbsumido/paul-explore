import { NextResponse, type NextRequest } from "next/server";
import { applyDismiss } from "@/lib/operator-bff";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> },
) {
  const { alertId } = await params;
  const alert = await applyDismiss(alertId);
  if (!alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }
  return NextResponse.json({ alert });
}
