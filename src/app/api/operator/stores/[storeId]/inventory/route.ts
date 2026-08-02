import { NextResponse, type NextRequest } from "next/server";
import { loadInventory } from "@/lib/operator-bff";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;
  return NextResponse.json({ items: await loadInventory(storeId) });
}
