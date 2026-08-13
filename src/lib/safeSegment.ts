/** Thrown when a dynamic route param can't be used as a single path segment. */
export class InvalidSegmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSegmentError";
  }
}

/**
 * Makes a dynamic route param safe to interpolate into an upstream URL.
 *
 * Next decodes dynamic segments before a handler sees them, so `%2e%2e%2f`
 * arrives as `../`. The WHATWG URL parser inside fetch() then normalises those
 * away, which means a raw param can move the request to a different upstream
 * path -- and buildHeaders has already attached the caller's bearer token by
 * then. Encoding alone isn't enough either: the value has to be rejected
 * before it is encoded, because encodeURIComponent("../x") is a perfectly
 * valid-looking segment that some upstreams will decode again.
 *
 * Rejects anything containing a path separator or a bare `..`, then encodes
 * whatever is left so characters that are legal in an id but meaningful in a
 * URL can't change the shape of the request.
 */
export function safeSegment(value: string | number): string {
  // Numbers are accepted so callers with a numeric id (a season, say) keep the
  // guard in place if that type ever loosens to string.
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new InvalidSegmentError("non-finite numeric segment");
    }
    return String(value);
  }

  if (typeof value !== "string" || value.trim() === "") {
    throw new InvalidSegmentError("empty path segment");
  }

  // Decode first so a double-encoded separator is caught rather than passed on.
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    throw new InvalidSegmentError("malformed percent-encoding");
  }

  for (const candidate of [value, decoded]) {
    if (candidate.includes("/") || candidate.includes("\\")) {
      throw new InvalidSegmentError("path separator in segment");
    }
    if (candidate === ".." || candidate === ".") {
      throw new InvalidSegmentError("relative path segment");
    }
    if (candidate.includes("\0")) {
      throw new InvalidSegmentError("null byte in segment");
    }
  }

  return encodeURIComponent(decoded);
}
