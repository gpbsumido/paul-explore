import { NextResponse } from "next/server";
import { loadFleetSummary } from "@/lib/operator-bff";

/**
 * Aggregated alert counts, inventory health, fleet stats, and alert trend for
 * every store in one response. Served by the portfolio_api operator service,
 * falling back to the in-memory seed when the backend is unreachable.
 */
export async function GET() {
  return NextResponse.json(await loadFleetSummary());
}
