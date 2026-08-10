import { NextResponse, type NextRequest } from "next/server";
import { withOperatorErrors } from "@/lib/operator-route-errors";
import { loadRestockSessions, openRestockSession } from "@/lib/operator-bff";

/** Open a restock session for a store. */
export const POST = withOperatorErrors(
  async (
    _request: NextRequest,
    { params }: { params: Promise<{ storeId: string }> },
  ) => {
    const { storeId } = await params;

    const session = await openRestockSession(storeId);
    if (!session) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return NextResponse.json({ session }, { status: 201 });
  },
);

/** The store's restock history, newest first. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;
  return NextResponse.json({ sessions: await loadRestockSessions(storeId) });
}
