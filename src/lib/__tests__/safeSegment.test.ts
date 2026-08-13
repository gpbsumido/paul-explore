import { describe, it, expect } from "vitest";
import { safeSegment, InvalidSegmentError } from "../safeSegment";

/**
 * Next decodes dynamic segments before the handler sees them, and the WHATWG
 * URL parser inside fetch() then normalises away any `..` that survived. A raw
 * param interpolated into an upstream URL can therefore address a different
 * path entirely, carrying whatever credentials buildHeaders attached.
 */
describe("safeSegment", () => {
  it("passes an ordinary id through unchanged", () => {
    expect(safeSegment("11111111-1111-1111-1111-111111111111")).toBe(
      "11111111-1111-1111-1111-111111111111",
    );
  });

  it.each([
    ["../../admin/users", "already-decoded traversal"],
    ["..", "bare dot-dot"],
    ["a/b", "embedded separator"],
    ["a\\b", "backslash separator"],
    ["", "empty segment"],
    ["   ", "whitespace only"],
  ])("rejects %s (%s)", (input) => {
    expect(() => safeSegment(input)).toThrow(InvalidSegmentError);
  });

  it("rejects a segment that would re-decode into a separator", () => {
    expect(() => safeSegment("%2e%2e%2fadmin")).toThrow(InvalidSegmentError);
  });

  it("encodes characters that are legal in an id but special in a URL", () => {
    expect(safeSegment("a b")).toBe("a%20b");
    expect(safeSegment("a?b")).toBe("a%3Fb");
    expect(safeSegment("a#b")).toBe("a%23b");
  });

  it("does not double-encode an already-safe value", () => {
    expect(safeSegment("abc-123_XYZ")).toBe("abc-123_XYZ");
  });
});

describe("safeSegment with numeric ids", () => {
  it("passes a finite number through as a string", () => {
    expect(safeSegment(2024)).toBe("2024");
  });

  it("rejects a non-finite number", () => {
    expect(() => safeSegment(Number.NaN)).toThrow(InvalidSegmentError);
    expect(() => safeSegment(Number.POSITIVE_INFINITY)).toThrow(InvalidSegmentError);
  });
});
