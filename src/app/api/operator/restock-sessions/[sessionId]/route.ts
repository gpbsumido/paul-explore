import { NextResponse, type NextRequest } from "next/server";
import { loadRestockSession } from "@/lib/operator-bff";

/** A session and its lines. Backs resuming a restock after a reload. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  const found = await loadRestockSession(sessionId);
  if (!found) {
    return NextResponse.json(
      { error: "Restock session not found" },
      { status: 404 },
    );
  }
  return NextResponse.json(found);
}
