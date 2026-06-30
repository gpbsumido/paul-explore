import { NextResponse, type NextRequest } from "next/server";
import { getInventory } from "@/lib/operator-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;
  const items = getInventory(storeId);
  if (!items) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }
  return NextResponse.json({ items });
}
