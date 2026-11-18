import { NextResponse } from "next/server";
import { InvalidSegmentError } from "@/lib/safeSegment";
import { OperatorApiError, OperatorContractError } from "@/lib/operator-client";

/**
 * The operator API rejected us rather than being unavailable.
 *
 * Distinct from an outage on purpose. An unreachable API is expected and the
 * seed fallback handles it; a 401 means this app and portfolio_api disagree
 * about OPERATOR_SERVICE_TOKEN, which is a configuration mistake that should be
 * fixed rather than papered over with fake data.
 */
export class OperatorServiceTokenError extends Error {
  constructor(readonly status: number) {
    super(
      "The operator API rejected this write. OPERATOR_SERVICE_TOKEN is missing here or does not match the one portfolio_api expects.",
    );
    this.name = "OperatorServiceTokenError";
  }
}

/**
 * The API is unreachable and the seed cannot stand in for this request.
 *
 * The seeded demo data only knows the stores it invented. When the backend is
 * down and someone asks about a real store id, returning an empty list would
 * render as "this store has no sales" rather than "we could not load them" --
 * which is exactly how the Tax and Sales tabs sat empty for a while without
 * anyone suspecting the backend.
 */
export class OperatorUnavailableError extends Error {
  constructor(what: string) {
    super(
      `Could not load ${what}. The operator API is unavailable and the demo data has nothing for this store.`,
    );
    this.name = "OperatorUnavailableError";
  }
}

/**
 * Turns either of those into a response someone can act on.
 *
 * Without this the throw becomes a bare 500 with an empty body, the UI says
 * "could not do that, try again", and the actual cause only exists in a server
 * log nobody is watching. A misconfiguration should say what to fix, and a
 * failed load should not be indistinguishable from an empty store.
 */
export function withOperatorErrors<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof OperatorServiceTokenError) {
        return NextResponse.json(
          { error: err.message },
          { status: 503, headers: { "x-operator-config": "token-mismatch" } },
        );
      }
      if (err instanceof OperatorUnavailableError) {
        // 503, not an empty 200. An empty list is a claim about the store.
        return NextResponse.json({ error: err.message }, { status: 503 });
      }
      if (err instanceof OperatorApiError) {
        // The API answered a write and said no. A 4xx is about the request, so
        // the caller gets it as is; a 5xx is the API failing, which from here
        // is a bad gateway.
        const status = err.status >= 500 ? 502 : err.status;
        return NextResponse.json(
          { error: `The operator API rejected this write (${err.status}).` },
          { status },
        );
      }
      if (err instanceof OperatorContractError) {
        console.error("[operator] unreadable answer to a write:", err);
        return NextResponse.json(
          {
            error:
              "The operator API answered with something unreadable. The change may have been saved, so reload before trying again.",
          },
          { status: 502 },
        );
      }
      if (err instanceof InvalidSegmentError) {
        // A rejected path segment is a malformed caller id, not the API being
        // down. 400 rather than a 503 that would page as an outage.
        return NextResponse.json(
          { error: "Invalid identifier" },
          { status: 400 },
        );
      }
      throw err;
    }
  };
}
