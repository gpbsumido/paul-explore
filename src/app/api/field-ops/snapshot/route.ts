import { NextResponse } from "next/server";
import { simulateFieldOps } from "@/lib/field-ops/sim";

export const dynamic = "force-dynamic";

/** GET /api/field-ops/snapshot: the whole fake picture right now. */
export async function GET() {
  return NextResponse.json(simulateFieldOps(Date.now()), {
    headers: { "Cache-Control": "no-store" },
  });
}
