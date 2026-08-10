import { NextResponse, type NextRequest } from "next/server";
import { withOperatorErrors } from "@/lib/operator-route-errors";
import { restockLineBodySchema } from "@/lib/operator-schemas";
import { parseBody } from "@/lib/parseBody";
import { saveRestockLine } from "@/lib/operator-bff";

/**
 * Record one slot. The schema enforces the rule that matters here: taking stock
 * off a shelf always needs a reason, because an unexplained removal is
 * indistinguishable from theft.
 */
export const PUT = withOperatorErrors(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string; itemId: string }> },
  ) => {
    const { sessionId, itemId } = await params;

    const bodyResult = await parseBody(request, restockLineBodySchema);
    if (!bodyResult.ok) return bodyResult.response;

    const line = await saveRestockLine(sessionId, itemId, bodyResult.data);
    if (!line) {
      return NextResponse.json(
        { error: "Restock session not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ line });
  },
);
