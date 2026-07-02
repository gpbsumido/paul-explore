import { NextResponse, type NextRequest } from "next/server";
import { restockBodySchema } from "@/lib/operator-schemas";
import { parseBody } from "@/lib/parseBody";
import { getStore, restockItems } from "@/lib/operator-data";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;

  if (!getStore(storeId)) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const bodyResult = await parseBody(request, restockBodySchema);
  if (!bodyResult.ok) return bodyResult.response;

  const result = restockItems(storeId, bodyResult.data.itemIds);
  if (!result) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  return NextResponse.json({ items: result.items, activity: result.activity });
}
