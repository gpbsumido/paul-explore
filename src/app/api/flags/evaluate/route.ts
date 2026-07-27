import { NextResponse, type NextRequest } from "next/server";
import { evaluateBodySchema } from "@/lib/flags-schemas";
import { parseBody } from "@/lib/parseBody";
import { getFlags } from "@/lib/flags-data";
import { evaluateAllFlags } from "@/lib/flags-engine";

/**
 * Evaluates every flag in the fleet against a single user context. This is the
 * same evaluation an SDK would run client- or server-side; exposing it as an
 * endpoint powers the console's evaluation playground.
 */
export async function POST(request: NextRequest) {
  const bodyResult = await parseBody(request, evaluateBodySchema);
  if (!bodyResult.ok) return bodyResult.response;

  const { environment, context } = bodyResult.data;
  const results = evaluateAllFlags(getFlags(), environment, context);
  return NextResponse.json({ results });
}
