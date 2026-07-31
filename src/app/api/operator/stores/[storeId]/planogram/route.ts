import { NextResponse, type NextRequest } from "next/server";
import { planogramUpdateSchema } from "@/lib/operator-schemas";
import { parseBody } from "@/lib/parseBody";
import {
  getPlanogram,
  reorderPlanogram,
  resyncPlanogramSlot,
} from "@/lib/operator-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;
  const slots = getPlanogram(storeId);
  if (!slots) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }
  return NextResponse.json({ slots });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;

  if (!getPlanogram(storeId)) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const bodyResult = await parseBody(request, planogramUpdateSchema);
  if (!bodyResult.ok) return bodyResult.response;

  const body = bodyResult.data;
  const slots =
    "order" in body
      ? reorderPlanogram(storeId, body.order)
      : resyncPlanogramSlot(storeId, body.resyncItemId);

  if (!slots) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  return NextResponse.json({ slots });
}
