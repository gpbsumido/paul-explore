import { NextResponse, type NextRequest } from "next/server";
import { completeSessionBodySchema } from "@/lib/operator-schemas";
import { parseBody } from "@/lib/parseBody";
import { applyRestockSession } from "@/lib/operator-bff";

/**
 * Apply a session to inventory. This is the only call that changes stock, so
 * everything a restocker did survives as an audit trail rather than collapsing
 * into "restocked to full".
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  const bodyResult = await parseBody(request, completeSessionBodySchema);
  if (!bodyResult.ok) return bodyResult.response;

  const applied = await applyRestockSession(sessionId, bodyResult.data.notes);
  if (!applied) {
    return NextResponse.json(
      { error: "Restock session not found" },
      { status: 404 },
    );
  }
  return NextResponse.json(applied);
}
