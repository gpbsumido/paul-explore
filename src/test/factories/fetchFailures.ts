/**
 * The errors Node's fetch rejects with, shaped the way Node 22 actually throws
 * them. Every one is `TypeError: fetch failed`, and only the cause says whether
 * the request ever left the building.
 */

/** A system error carrying the errno code Node puts on a failed socket. */
function systemError(message: string, code: string): Error {
  return Object.assign(new Error(message), { code });
}

/** `fetch failed`, with whatever Node gave as the reason. */
function fetchFailed(cause?: unknown): TypeError {
  return new TypeError("fetch failed", cause === undefined ? undefined : { cause });
}

/** Failures where the request never reached the API, so the seed may stand in. */
export const REFUSED_CONNECTIONS = [
  {
    label: "refused",
    error: fetchFailed(systemError("connect ECONNREFUSED 127.0.0.1:3001", "ECONNREFUSED")),
  },
  {
    label: "unknown host",
    error: fetchFailed(systemError("getaddrinfo ENOTFOUND api.example", "ENOTFOUND")),
  },
  {
    label: "DNS not answering",
    error: fetchFailed(systemError("getaddrinfo EAI_AGAIN api.example", "EAI_AGAIN")),
  },
  {
    // localhost resolves to ::1 and 127.0.0.1, so Node tries both and reports
    // each refusal inside an AggregateError.
    label: "refused on every address",
    error: fetchFailed(
      new AggregateError([
        systemError("connect ECONNREFUSED ::1:3001", "ECONNREFUSED"),
        systemError("connect ECONNREFUSED 127.0.0.1:3001", "ECONNREFUSED"),
      ]),
    ),
  },
];

/** Failures that don't prove the request never arrived, so it may have landed. */
export const DROPPED_CONNECTIONS = [
  {
    // What Node gives when the server read the whole body and then hung up.
    label: "socket closed after sending",
    error: fetchFailed(systemError("other side closed", "UND_ERR_SOCKET")),
  },
  { label: "no cause at all", error: fetchFailed() },
];
