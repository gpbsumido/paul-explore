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
 * The API rejected the write even though this route allowed it. Worth its own
 * message: it reads identically to our own 401 otherwise, and the two mean
 * opposite things -- one is "sign in", the other is "you did, and the token
 * still was not accepted", which no amount of signing in will fix.
 */
const UPSTREAM_REJECTED =
  "The flags API rejected this write. Your session is fine — the token it received was not accepted.";

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
  // Pass the key even when the flag is not in the local seed. getFlag() only
  // knows the seeded flags, and the API serves a different, larger set -- so
  // dropping the key here sent every API-only flag down the wrong tier.
  const flag = getFlag(flagKey);
  const access = accessOf({ key: flagKey, ...(flag ?? {}) });
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
  if (isLoggedIn) {
    // A real session beats the service token at every rung, including the open
    // one. Using the server's credential when the visitor has their own would
    // attribute their change to the server in the audit log, and would make
    // the write depend on a credential the API may not accept when a perfectly
    // good user token was already in hand.
    const { token } = await auth0.getAccessToken();
    outcome = await applyFlagPatch(flagKey, bodyResult.data, token);
  } else if (access === "open") {
    if (serviceToken) {
      outcome = await applyFlagPatch(flagKey, bodyResult.data, serviceToken);
    } else if (getFlag(flagKey)) {
      // No service token, but the flag exists locally, so the in-memory store
      // can answer. Fine for local dev and CI.
      outcome = patchSeedStore(flagKey, bodyResult.data);
    } else {
      // The flag only exists upstream and there is no token to reach it with.
      // Say that plainly rather than 404ing, which would claim the flag does
      // not exist when the real problem is that this server cannot write it.
      return NextResponse.json(
        {
          error:
            "This flag can only be changed by a signed-in user until FLAGS_SERVICE_TOKEN is configured on the server.",
        },
        { status: 503 },
      );
    }
  } else {
    // Unreachable: the gate above already refused every signed-out caller
    // outside the open rung.
    return NextResponse.json({ error: ERRORS[401] }, { status: 401 });
  }

  if (outcome.status !== 200 || !outcome.flag) {
    // A 401 here came from upstream, not from the gate above -- the gate
    // already let this caller through.
    if (outcome.status === 401) {
      return NextResponse.json({ error: UPSTREAM_REJECTED }, { status: 502 });
    }
    return NextResponse.json(
      { error: ERRORS[outcome.status] ?? "Could not update the flag" },
      { status: outcome.status },
    );
  }

  return NextResponse.json({ flag: outcome.flag });
}
