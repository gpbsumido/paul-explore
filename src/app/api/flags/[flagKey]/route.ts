import { NextResponse, type NextRequest } from "next/server";
import { updateFlagBodySchema } from "@/lib/flags-schemas";
import { parseBody } from "@/lib/parseBody";
import { applyFlagPatch } from "@/lib/flags-bff";
import { getFlag } from "@/lib/flags-data";
import { auth0 } from "@/lib/auth0";
import { isAllowedEmail } from "@/lib/emailAllowlist";

const ERRORS: Record<number, string> = {
  401: "Sign in to change flags",
  403: "You are not allowed to change this flag",
  404: "Flag not found",
};

/**
 * Updates a flag's per-environment config: the kill switch (`enabled`) and/or
 * the fallthrough rollout weights. Proxies to the live API, forwarding a
 * server-resolved bearer token so the write is authorized and attributed;
 * falls back to the seed store when the API is unreachable.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ flagKey: string }> },
) {
  const { flagKey } = await params;

  const bodyResult = await parseBody(request, updateFlagBodySchema);
  if (!bodyResult.ok) return bodyResult.response;

  // Only the real flag (the one that gates a live feature) is gated. Demo flags
  // are open to everyone so anyone can play with the console.
  //
  // "Signed in" is not the bar here. A flag write changes what every visitor
  // sees, so being any signed-in stranger should not be enough to flip a live
  // feature off. The bar is the same verified-email allowlist the ask box uses.
  const flag = getFlag(flagKey);
  let token: string | undefined;

  if (flag?.real) {
    const session = await auth0.getSession(request);
    if (!session) {
      return NextResponse.json({ error: ERRORS[401] }, { status: 401 });
    }

    const isAdmin = isAllowedEmail({
      email: session.user?.email,
      emailVerified: session.user?.email_verified === true,
      allowlist: process.env.FLAG_ADMIN_ALLOWED_EMAILS,
    });
    if (!isAdmin) {
      return NextResponse.json({ error: ERRORS[403] }, { status: 403 });
    }

    // Resolved from the session, never read off the inbound request. A token
    // taken from a caller-supplied Authorization header is whatever the caller
    // decided to put there, which makes the audit trail's actor a suggestion.
    token = (await auth0.getAccessToken()).token;
  }

  const outcome = await applyFlagPatch(flagKey, bodyResult.data, token);

  if (outcome.status !== 200 || !outcome.flag) {
    return NextResponse.json(
      { error: ERRORS[outcome.status] ?? "Could not update the flag" },
      { status: outcome.status },
    );
  }

  return NextResponse.json({ flag: outcome.flag });
}
