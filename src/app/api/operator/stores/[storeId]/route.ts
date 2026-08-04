import { NextResponse, type NextRequest } from "next/server";
import { loadStore } from "@/lib/operator-bff";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;
  const store = await loadStore(storeId);
  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }
  return NextResponse.json({ store });
}
