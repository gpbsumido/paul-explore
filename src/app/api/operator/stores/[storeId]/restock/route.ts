import { NextResponse, type NextRequest } from "next/server";
import { withOperatorErrors } from "@/lib/operator-route-errors";
import { restockBodySchema } from "@/lib/operator-schemas";
import { parseBody } from "@/lib/parseBody";
import { applyRestock } from "@/lib/operator-bff";

export const POST = withOperatorErrors(async (
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) => {
  const { storeId } = await params;

  const bodyResult = await parseBody(request, restockBodySchema);
  if (!bodyResult.ok) return bodyResult.response;

  const result = await applyRestock(storeId, bodyResult.data.itemIds);
  if (!result) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }
  return NextResponse.json({ items: result.items, activity: result.activity });
})
