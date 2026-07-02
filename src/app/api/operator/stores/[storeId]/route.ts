import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/operator-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;
  const store = getStore(storeId);
  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }
  return NextResponse.json({ store });
}
