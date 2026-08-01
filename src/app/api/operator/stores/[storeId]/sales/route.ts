import { NextResponse, type NextRequest } from "next/server";
import { loadSales } from "@/lib/operator-bff";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;
  return NextResponse.json({ sales: await loadSales(storeId) });
}
