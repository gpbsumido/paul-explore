import { NextResponse, type NextRequest } from "next/server";
import { evaluateBodySchema } from "@/lib/flags-schemas";
import { parseBody } from "@/lib/parseBody";
import { loadFleet } from "@/lib/flags-bff";
import { evaluateAllFlags } from "@/lib/flags-engine";

/**
 * Evaluates every flag in the fleet against a single user context. The fleet
 * comes from the live API (falling back to the seed when it is down); the
 * evaluation itself runs here through the deterministic engine, the same way an
 * SDK would evaluate client- or server-side.
 */
export async function POST(request: NextRequest) {
  const bodyResult = await parseBody(request, evaluateBodySchema);
  if (!bodyResult.ok) return bodyResult.response;

  const { environment, context } = bodyResult.data;
  const { flags } = await loadFleet();
  const results = evaluateAllFlags(flags, environment, context);
  return NextResponse.json({ results });
}
