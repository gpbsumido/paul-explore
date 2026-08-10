import { NextResponse, type NextRequest } from "next/server";
import { withOperatorErrors } from "@/lib/operator-route-errors";
import { stopPromotion } from "@/lib/operator-bff";

/** End a promotion now. Closes it rather than deleting it. */
export const PATCH = withOperatorErrors(
  async (
    _request: NextRequest,
    { params }: { params: Promise<{ promotionId: string }> },
  ) => {
    const { promotionId } = await params;

    const promotion = await stopPromotion(promotionId);
    if (!promotion) {
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ promotion });
  },
);
