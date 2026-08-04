import { NextResponse, type NextRequest } from "next/server";
import { withOperatorErrors } from "@/lib/operator-route-errors";
import { promotionBodySchema } from "@/lib/operator-schemas";
import { parseBody } from "@/lib/parseBody";
import { createPromotion, loadPromotions } from "@/lib/operator-bff";

/** Every promotion for a store, with a status derived per read. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;
  return NextResponse.json({ promotions: await loadPromotions(storeId) });
}

/** Schedule one. Emits a price-update activity event. */
export const POST = withOperatorErrors(async (
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) => {
  const { storeId } = await params;

  const bodyResult = await parseBody(request, promotionBodySchema);
  if (!bodyResult.ok) return bodyResult.response;

  const promotion = await createPromotion(storeId, bodyResult.data);
  if (!promotion) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }
  return NextResponse.json({ promotion }, { status: 201 });
})
