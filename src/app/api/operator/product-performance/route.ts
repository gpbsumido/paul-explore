import { NextResponse, type NextRequest } from "next/server";
import { loadProductPerformance } from "@/lib/operator-bff";
import { daysForRange } from "@/lib/operator-product-performance";

/**
 * Fleet-wide product performance for a range (7d/30d/90d), aggregated across
 * every store's sales and inventory. Defaults to 30 days for a missing or
 * unknown range.
 */
export async function GET(request: NextRequest) {
  const rangeId = request.nextUrl.searchParams.get("range") ?? "30d";
  const days = daysForRange(rangeId);
  const products = await loadProductPerformance(days);
  return NextResponse.json({ rangeId, days, products });
}
