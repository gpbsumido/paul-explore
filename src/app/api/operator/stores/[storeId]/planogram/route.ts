import { NextResponse, type NextRequest } from "next/server";
import { withOperatorErrors } from "@/lib/operator-route-errors";
import { planogramUpdateSchema } from "@/lib/operator-schemas";
import { parseBody } from "@/lib/parseBody";
import { loadPlanogram, applyPlanogramUpdate } from "@/lib/operator-bff";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;
  return NextResponse.json({ slots: await loadPlanogram(storeId) });
}

export const PATCH = withOperatorErrors(async (
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) => {
  const { storeId } = await params;

  const bodyResult = await parseBody(request, planogramUpdateSchema);
  if (!bodyResult.ok) return bodyResult.response;

  const slots = await applyPlanogramUpdate(storeId, bodyResult.data);
  if (!slots) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }
  return NextResponse.json({ slots });
})
