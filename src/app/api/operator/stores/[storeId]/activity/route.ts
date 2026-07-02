import { NextResponse, type NextRequest } from "next/server";
import { getActivity } from "@/lib/operator-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;
  const events = getActivity(storeId);
  if (!events) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }
  return NextResponse.json({ events });
}
