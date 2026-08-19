import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchStore, postRestock } from "@/lib/operator-client";
import { InvalidSegmentError } from "@/lib/safeSegment";

// These calls carry OPERATOR_SERVICE_TOKEN and are reachable unauthenticated,
// so a malformed id must be rejected before it can move the request to a
// different upstream path. The guard has to fire before fetch runs, not after.
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("operator-client path-segment guard", () => {
  it("rejects a store id containing a path separator without any fetch (read)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchStore("a/b")).rejects.toBeInstanceOf(InvalidSegmentError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a traversal store id without any fetch (write)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(postRestock("..", ["item-1"])).rejects.toBeInstanceOf(
      InvalidSegmentError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lets a well-formed id through to fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          store: {
            id: "store-1",
            name: "Downtown",
            region: "West",
            status: "healthy",
            lastSyncedAt: new Date().toISOString(),
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchStore("store-1").catch(() => {
      // Schema shape is not what this test asserts; only that the guard let the
      // request reach fetch on a clean id.
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/stores/store-1");
  });
});
