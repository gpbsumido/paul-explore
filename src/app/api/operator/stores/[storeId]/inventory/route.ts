import { NextResponse, type NextRequest } from "next/server";
import { withOperatorErrors } from "@/lib/operator-route-errors";
import { loadInventory } from "@/lib/operator-bff";

export const GET = withOperatorErrors(
  async (
    _request: NextRequest,
    { params }: { params: Promise<{ storeId: string }> },
  ) => {
    const { storeId } = await params;
    return NextResponse.json({ items: await loadInventory(storeId) });
  },
);
