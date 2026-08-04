import { NextResponse, type NextRequest } from "next/server";
import { salesGranularitySchema } from "@/lib/operator-schemas";
import { DEFAULT_ZONE, isValidTimeZone } from "@/lib/operator-timezone";
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

  // A bad zone is dropped rather than proxied. The API rejects it with a 400,
  // and a fleet chart is not worth failing over a malformed query string.
  const tz = request.nextUrl.searchParams.get("tz") ?? "";
  const timeZone = isValidTimeZone(tz) ? tz : DEFAULT_ZONE;

  return NextResponse.json(await loadSalesAnalytics(granularity, timeZone));
}
