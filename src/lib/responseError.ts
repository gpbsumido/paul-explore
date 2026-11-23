/** A failed response, with the status kept so a caller can word a known one itself. */
export class ResponseError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ResponseError";
    this.status = status;
  }
}

/** The `{ error }` sentence a BFF route answers with, if the body has one. */
async function readErrorMessage(res: Response): Promise<string | null> {
  try {
    const body: unknown = await res.json();
    if (typeof body !== "object" || body === null || !("error" in body)) return null;
    const { error } = body;
    return typeof error === "string" && error.trim() ? error : null;
  } catch {
    // Not JSON (an HTML error page, an empty 502), so there's no reason to show.
    return null;
  }
}

/**
 * What the shared route helpers (upstream, parseBody, withBackend) answer with.
 * They're labels for the logs, and "Upstream timed out" tells the person who
 * clicked nothing they can act on. The test builds these responses from the
 * real helpers, so a renamed label fails there instead of reaching the screen.
 */
const ROUTE_HELPER_LABELS = new Set([
  "Upstream timed out",
  "Backend unavailable",
  "Invalid request body",
  "Invalid JSON",
  "Payload too large",
  "Not authenticated",
  "Invalid identifier",
]);

/**
 * Turns a non-ok response into an error worth showing.
 *
 * A route that refuses a request on purpose (a 409 for a second active wallet,
 * a 403 for a viewer editing a calendar) answers `{ error }` with a sentence
 * for whoever clicked, so that sentence wins. So does a 503 that says why, like
 * a pack that can't be drawn. A shared helper's log label, an HTML page from a
 * proxy or a body with no reason in it all get the caller's own wording instead.
 */
export async function responseError(res: Response, fallback: string): Promise<ResponseError> {
  const reason = await readErrorMessage(res);
  const shown = reason && !ROUTE_HELPER_LABELS.has(reason) ? reason : fallback;
  return new ResponseError(shown, res.status);
}

/**
 * Fetches JSON from a BFF route and returns the parsed body, or throws a
 * ResponseError carrying the server's reason.
 */
export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw await responseError(res, `Request failed (${res.status})`);
  return res.json();
}
