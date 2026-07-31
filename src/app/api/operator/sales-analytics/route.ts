import { NextResponse, type NextRequest } from "next/server";
import { salesGranularitySchema } from "@/lib/operator-schemas";
import { aggregateFleetSales } from "@/lib/operator-sales";
import { getStores, getSales } from "@/lib/operator-data";

/**
 * Fleet-wide sales analytics for a granularity (day/week/month/year). Rolls
 * every store's sales into shared time buckets and a per-store ranking. The
 * aggregation happens server-side so the client makes one request regardless
 * of fleet size.
 */
export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams.get("granularity");
  const parsed = salesGranularitySchema.safeParse(param ?? "month");
  const granularity = parsed.success ? parsed.data : "month";

  const fleet = getStores().map((store) => ({
    storeId: store.id,
    storeName: store.name,
    sales: getSales(store.id) ?? [],
  }));

  return NextResponse.json(aggregateFleetSales(fleet, granularity));
}
