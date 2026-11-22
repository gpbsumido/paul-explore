import { NextResponse } from "next/server";
import { InvalidSegmentError } from "@/lib/safeSegment";

/**
 * The deadline for a call from the server to portfolio_api, reads and writes.
 *
 * Eight seconds because that is the value /api/geo has been running in
 * production with, and reusing a number that has already survived beats
 * inventing a fresh one.
 */
export const UPSTREAM_TIMEOUT_MS = 8_000;

/** Socket codes that mean no connection was ever made, so nothing was sent. */
const NEVER_CONNECTED_CODES: ReadonlySet<unknown> = new Set(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"]);

/** The errno-style `code` Node puts on a socket error, if there is one. */
function codeOf(value: unknown): unknown {
  return typeof value === "object" && value !== null && "code" in value ? value.code : undefined;
}

/**
 * Whether a rejected fetch might still have delivered its request.
 *
 * Node rejects with the same `TypeError: fetch failed` for a refused connection
 * and for a server that read the whole body and then hung up. Only the cause
 * tells them apart, so a write is treated as never sent only when the cause (or
 * one of the addresses Node tried, for a host with several) is a refusal or a
 * failed lookup. Anything else might have landed, and replaying it somewhere
 * else would report a success that isn't the real outcome.
 */
export function fetchMayHaveLanded(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false;
  const causes = err.cause instanceof AggregateError ? [err.cause, ...err.cause.errors] : [err.cause];
  return !causes.some((cause) => NEVER_CONNECTED_CODES.has(codeOf(cause)));
}

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
  const { timeoutMs = UPSTREAM_TIMEOUT_MS, ...rest } = init;

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

/**
 * Wraps a public proxy route so a rejected path segment answers 400, the same
 * as withBackend does for the signed-in routes. Without it safeSegment's throw
 * escapes the handler as an unhandled 500.
 */
export function rejectInvalidSegments<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>,
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof InvalidSegmentError) {
        return NextResponse.json({ error: "Invalid identifier" }, { status: 400 });
      }
      throw err;
    }
  };
}
