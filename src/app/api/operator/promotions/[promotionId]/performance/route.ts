import { NextResponse, type NextRequest } from "next/server";
import { loadPromotionPerformance } from "@/lib/operator-bff";

/**
 * What a promotion did, against the equal-length period before it. A
 * before-and-after rather than attribution, which the payload's note says.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ promotionId: string }> },
) {
  const { promotionId } = await params;

  const performance = await loadPromotionPerformance(promotionId);
  if (!performance) {
    return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
  }
  return NextResponse.json(performance);
}
