import { NextResponse, type NextRequest } from "next/server";
import { withOperatorErrors } from "@/lib/operator-route-errors";
import { loadActivity } from "@/lib/operator-bff";

export const GET = withOperatorErrors(
  async (
    _request: NextRequest,
    { params }: { params: Promise<{ storeId: string }> },
  ) => {
    const { storeId } = await params;
    return NextResponse.json({ events: await loadActivity(storeId) });
  },
);
