import { NextResponse, type NextRequest } from "next/server";
import { updateFlagBodySchema } from "@/lib/flags-schemas";
import { parseBody } from "@/lib/parseBody";
import { getFlag, setFlagEnabled, setFallthrough } from "@/lib/flags-data";
import type { Flag } from "@/types/flags";

/**
 * Updates a flag's per-environment config: the kill switch (`enabled`) and/or
 * the fallthrough rollout weights. Both changes are recorded in the audit log.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ flagKey: string }> },
) {
  const { flagKey } = await params;

  if (!getFlag(flagKey)) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  const bodyResult = await parseBody(request, updateFlagBodySchema);
  if (!bodyResult.ok) return bodyResult.response;

  const { environment, enabled, fallthrough } = bodyResult.data;

  let updated: Flag | undefined;
  if (enabled !== undefined) {
    updated = setFlagEnabled(flagKey, environment, enabled);
  }
  if (fallthrough !== undefined) {
    updated = setFallthrough(flagKey, environment, fallthrough);
  }

  if (!updated) {
    return NextResponse.json(
      { error: "Environment not configured for this flag" },
      { status: 404 },
    );
  }

  return NextResponse.json({ flag: updated });
}
