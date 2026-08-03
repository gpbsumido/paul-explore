import { NextResponse } from "next/server";

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
 * Turns that into a response someone can act on.
 *
 * Without this the throw becomes a bare 500 with an empty body, the UI says
 * "could not do that, try again", and the actual cause only exists in a server
 * log nobody is watching. A misconfiguration should say what to fix.
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
      throw err;
    }
  };
}
