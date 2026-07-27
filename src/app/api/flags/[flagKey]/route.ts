import { NextResponse, type NextRequest } from "next/server";
import { updateFlagBodySchema } from "@/lib/flags-schemas";
import { parseBody } from "@/lib/parseBody";
import { applyFlagPatch } from "@/lib/flags-bff";

const ERRORS: Record<number, string> = {
  401: "Sign in to change flags",
  404: "Flag not found",
};

/**
 * Updates a flag's per-environment config: the kill switch (`enabled`) and/or
 * the fallthrough rollout weights. Proxies to the live API, forwarding the
 * visitor's bearer token so the write is authorized and attributed to them;
 * falls back to the seed store when the API is unreachable.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ flagKey: string }> },
) {
  const { flagKey } = await params;

  const bodyResult = await parseBody(request, updateFlagBodySchema);
  if (!bodyResult.ok) return bodyResult.response;

  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  const outcome = await applyFlagPatch(flagKey, bodyResult.data, token);

  if (outcome.status !== 200 || !outcome.flag) {
    return NextResponse.json(
      { error: ERRORS[outcome.status] ?? "Could not update the flag" },
      { status: outcome.status },
    );
  }

  return NextResponse.json({ flag: outcome.flag });
}
