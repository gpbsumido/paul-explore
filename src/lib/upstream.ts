import { NextResponse } from "next/server";

/**
 * Default deadline for a call from a BFF route to portfolio_api.
 *
 * Eight seconds because that is the value /api/geo has been running in
 * production with, and reusing a number that has already survived beats
 * inventing a fresh one.
 */
const DEFAULT_TIMEOUT_MS = 8_000;

export type UpstreamResult =
  | { ok: true; response: Response }
  | { ok: false; cause: "timeout" | "unreachable"; message: string };

interface UpstreamInit extends RequestInit {
  timeoutMs?: number;
}

/**
 * Calls portfolio_api with a deadline.
 *
 * Every BFF route used to call fetch() with no timeout, which is fine right up
 * until the API is slow rather than down. When stats.nba.com stopped answering,
 * the API took 71 seconds to fail, and the routes in front of it waited the
 * whole time. React Query never rejected, so the pages never reached their
 * error branch, and a visitor got a Team dropdown reading "Select a team..."
 * with nothing in it -- identical to there being no teams. Absence rendered as
 * a normal empty state, which is the same failure the operator dashboard was
 * just fixed for.
 *
 * Returns a result rather than throwing so route handlers stay flat, and keeps
 * timeout separate from unreachable: one means slow, the other means down, and
 * only one of them is worth paging about.
 *
 * A non-2xx response is a success here. A 404 from the API is something the
 * upstream actually told us, and rewriting it as a transport failure would
 * throw away the only real information in the exchange.
 */
export async function fetchUpstream(
  url: string,
  init: UpstreamInit = {},
): Promise<UpstreamResult> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = init;

  try {
    const response = await fetch(url, {
      ...rest,
      signal: rest.signal ?? AbortSignal.timeout(timeoutMs),
    });
    return { ok: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.name : "";
    const timedOut = name === "TimeoutError" || name === "AbortError";
    return {
      ok: false,
      cause: timedOut ? "timeout" : "unreachable",
      message,
    };
  }
}

/**
 * Turns a failed upstream call into the response a route should send.
 *
 * 504 for a deadline and 502 for unreachable, so a log or a dashboard can tell
 * a slow dependency from a missing one without reading the message.
 */
export function upstreamErrorResponse(
  result: Extract<UpstreamResult, { ok: false }>,
): NextResponse {
  const timedOut = result.cause === "timeout";
  return NextResponse.json(
    {
      error: timedOut ? "Upstream timed out" : "Backend unavailable",
      cause: result.cause,
    },
    { status: timedOut ? 504 : 502 },
  );
}

/**
 * The whole "proxy a public GET to portfolio_api" shape the NBA routes each
 * hand-wrote: call the upstream with a deadline, turn a transport failure into
 * 504/502, pass a non-2xx through as `{ error: errorLabel }` at the same
 * status, and otherwise forward the JSON with an optional cache header. A
 * malformed body (or any other throw while reading it) becomes a 502, matching
 * the routes' previous catch.
 */
export async function proxyUpstream(
  url: string,
  { errorLabel, cacheControl }: { errorLabel: string; cacheControl?: string },
): Promise<NextResponse> {
  try {
    const result = await fetchUpstream(url);
    if (!result.ok) return upstreamErrorResponse(result);
    const res = result.response;
    if (!res.ok) {
      return NextResponse.json({ error: errorLabel }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(
      data,
      cacheControl ? { headers: { "Cache-Control": cacheControl } } : undefined,
    );
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
