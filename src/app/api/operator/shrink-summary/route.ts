import { NextResponse } from "next/server";
import { loadFleetShrink } from "@/lib/operator-bff";

/**
 * Fleet-wide shrink and loss: per-store unexplained shrink versus reasoned
 * removals, reconciled from completed restock counts and totalled for the fleet.
 */
export async function GET() {
  return NextResponse.json(await loadFleetShrink());
}
