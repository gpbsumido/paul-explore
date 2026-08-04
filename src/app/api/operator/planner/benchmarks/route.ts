import { NextResponse } from "next/server";
import { loadPlannerBenchmarks } from "@/lib/operator-bff";

/**
 * Fleet-wide planner benchmarks (mean basket price and items per order) so the
 * location planner can offer the operator's own numbers as defaults. Benchmarks
 * are null when the fleet has no sales to learn from.
 */
export async function GET() {
  return NextResponse.json({ benchmarks: await loadPlannerBenchmarks() });
}
