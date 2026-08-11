import { NextResponse, type NextRequest } from "next/server";
import { updateFlagBodySchema } from "@/lib/flags-schemas";
import { parseBody } from "@/lib/parseBody";
import { applyFlagPatch, patchSeedStore } from "@/lib/flags-bff";
import { getFlag } from "@/lib/flags-data";
import { auth0 } from "@/lib/auth0";
import { isAllowedEmail } from "@/lib/emailAllowlist";
import { accessOf, canChangeFlag } from "@/lib/flags-access";

const ERRORS: Record<number, string> = {
  401: "Sign in to change this flag",
  403: "Only the site owner can change this flag",
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

  // Read the session before the body. parseBody consumes the request, and
  // auth0.getSession() reads it too -- doing it the other way round throws
  // "Response body object should not be disturbed or locked" and the write
  // 500s, which from the console looks identical to being rejected.
  const session = await auth0.getSession(request);

  const bodyResult = await parseBody(request, updateFlagBodySchema);
  if (!bodyResult.ok) return bodyResult.response;

  // Three tiers, enforced through the same module the console renders from, so
  // what the page promises and what the server allows cannot drift apart.
  const flag = getFlag(flagKey);
  const access = accessOf(flag ?? {});
  const isLoggedIn = Boolean(session);
  const isAdmin = isAllowedEmail({
    email: session?.user?.email,
    emailVerified: session?.user?.email_verified === true,
    allowlist: process.env.FLAG_ADMIN_ALLOWED_EMAILS,
  });

  if (!canChangeFlag({ access, isLoggedIn, isAdmin })) {
    // Distinguish "you are not signed in" from "you are, and it is still not
    // yours". Collapsing them sends someone to a login screen that will not
    // help.
    const status = isLoggedIn ? 403 : 401;
    return NextResponse.json({ error: ERRORS[status] }, { status });
  }

  // Which credential the write travels on depends on the tier.
  //
  // The open tier has no session to borrow from, and the API authorizes every
  // write on a token -- so without one an anonymous change reaches only the
  // in-memory store and springs back on the next read, which is the same
  // silent revert this console was already caught by once. The server carries
  // a token of its own for exactly this, the way OPERATOR_SERVICE_TOKEN lets
  // the public operator demo write without a user. Where it is unset (local
  // dev, CI) the tier degrades to the in-memory store rather than failing.
  //
  // Above that tier the write must carry a real identity, so the service token
  // is deliberately not reused: attributing an admin's kill switch to the
  // server would make the allowlist pointless and the audit log a fiction. The
  // user's token is resolved from the session, never read off the inbound
  // request -- a caller-supplied Authorization header is whatever the caller
  // decided to put there.
  const serviceToken = process.env.FLAGS_SERVICE_TOKEN;

  let outcome;
  if (access === "open") {
    outcome = serviceToken
      ? await applyFlagPatch(flagKey, bodyResult.data, serviceToken)
      : patchSeedStore(flagKey, bodyResult.data);
  } else {
    const { token } = await auth0.getAccessToken();
    outcome = await applyFlagPatch(flagKey, bodyResult.data, token);
  }

  if (outcome.status !== 200 || !outcome.flag) {
    return NextResponse.json(
      { error: ERRORS[outcome.status] ?? "Could not update the flag" },
      { status: outcome.status },
    );
  }

  return NextResponse.json({ flag: outcome.flag });
}
