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
 * Turns a non-ok response into an error worth showing.
 *
 * The BFF routes answer a failure with `{ error }`, written for whoever
 * clicked, so that sentence wins. Anything else, an HTML page from a proxy or a
 * body with no reason in it, gets the caller's own wording instead.
 */
export async function responseError(res: Response, fallback: string): Promise<ResponseError> {
  return new ResponseError((await readErrorMessage(res)) ?? fallback, res.status);
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
