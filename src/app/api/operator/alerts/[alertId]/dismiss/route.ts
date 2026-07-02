import { NextResponse, type NextRequest } from "next/server";
import { dismissAlert } from "@/lib/operator-data";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> },
) {
  const { alertId } = await params;
  const alert = dismissAlert(alertId);
  if (!alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }
  return NextResponse.json({ alert });
}
