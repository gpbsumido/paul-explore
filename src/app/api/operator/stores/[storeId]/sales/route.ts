import { NextResponse, type NextRequest } from "next/server";
import { getSales } from "@/lib/operator-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;
  const sales = getSales(storeId);
  if (!sales) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }
  return NextResponse.json({ sales });
}
