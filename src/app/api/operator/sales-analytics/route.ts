import { NextResponse, type NextRequest } from "next/server";
import { salesGranularitySchema } from "@/lib/operator-schemas";
import { loadSalesAnalytics } from "@/lib/operator-bff";

/**
 * Fleet-wide sales analytics for a granularity (day/week/month/year). Served by
 * the portfolio_api operator service, which aggregates in SQL; falls back to
 * the in-memory seed aggregation when the backend is unreachable.
 */
export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams.get("granularity");
  const parsed = salesGranularitySchema.safeParse(param ?? "month");
  const granularity = parsed.success ? parsed.data : "month";

  return NextResponse.json(await loadSalesAnalytics(granularity));
}
