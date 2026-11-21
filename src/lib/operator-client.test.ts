import { describe, it, expect, vi, afterEach } from "vitest";
import * as client from "@/lib/operator-client";
import {
  fetchStore,
  fetchStores,
  patchDismiss,
  postRestock,
  OperatorApiError,
  OperatorContractError,
} from "@/lib/operator-client";
import { buildStore } from "@/test/factories/operator";
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

/** Every call that puts a caller-supplied id into the upstream path. */
const ID_TAKING_CALLS: ReadonlyArray<readonly [string, () => Promise<unknown>]> = [
  ["fetchStore", () => client.fetchStore("a/b")],
  ["fetchInventory", () => client.fetchInventory("a/b")],
  ["fetchAlerts", () => client.fetchAlerts("a/b")],
  ["fetchActivity", () => client.fetchActivity("a/b")],
  ["fetchSales", () => client.fetchSales("a/b")],
  ["fetchPlanogram", () => client.fetchPlanogram("a/b")],
  ["postRestock", () => client.postRestock("a/b", [])],
  ["patchDismiss", () => client.patchDismiss("a/b")],
  ["patchPlanogram", () => client.patchPlanogram("a/b", { resyncItemId: "x" })],
  ["postRestockSession", () => client.postRestockSession("a/b")],
  ["fetchRestockSessions", () => client.fetchRestockSessions("a/b")],
  ["fetchRestockSession", () => client.fetchRestockSession("a/b")],
  [
    "putRestockLine (session id)",
    () =>
      client.putRestockLine("a/b", "item", {
        expectedQty: 1,
        countedQty: 1,
        added: 0,
        removed: 0,
        removalReason: null,
      }),
  ],
  [
    "putRestockLine (item id)",
    () =>
      client.putRestockLine("session", "a/b", {
        expectedQty: 1,
        countedQty: 1,
        added: 0,
        removed: 0,
        removalReason: null,
      }),
  ],
  ["postCompleteRestock", () => client.postCompleteRestock("a/b", null)],
  ["fetchPromotions", () => client.fetchPromotions("a/b")],
  [
    "postPromotion",
    () =>
      client.postPromotion("a/b", {
        productName: null,
        percent: 10,
        startsAt: "2026-07-01T00:00:00.000Z",
        endsAt: null,
      }),
  ],
  ["patchEndPromotion", () => client.patchEndPromotion("a/b")],
  ["fetchPromotionPerformance", () => client.fetchPromotionPerformance("a/b")],
];

describe("every id-taking call refuses a path separator before fetch runs", () => {
  it.each(ID_TAKING_CALLS)("%s", async (_name, call) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(call()).rejects.toBeInstanceOf(InvalidSegmentError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("operator-client responses", () => {
  it("returns the parsed body of a good read", async () => {
    const store = buildStore({ name: "Downtown" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ stores: [store] }), { status: 200 })),
    );

    const stores = await fetchStores();

    expect(stores.map((row) => row.name)).toEqual(["Downtown"]);
  });

  it("surfaces a non-2xx read as an OperatorApiError carrying the status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 404 })));

    await expect(fetchStores()).rejects.toMatchObject({ name: "OperatorApiError", status: 404 });
  });

  it("surfaces a non-2xx write as an OperatorApiError, not a contract error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 409 })));

    const failure = await patchDismiss("alert-1").catch((err: unknown) => err);

    expect(failure).toBeInstanceOf(OperatorApiError);
    expect(failure).not.toBeInstanceOf(OperatorContractError);
    expect(failure).toMatchObject({ status: 409 });
  });

  it("encodes the product-performance range into the query string", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await client.fetchProductPerformance("7d&x=1").catch(() => {
      // the body doesn't match the schema; only the request url matters here
    });

    expect(String(fetchMock.mock.calls[0][0])).toContain("range=7d%26x%3D1");
  });
});

describe("operator-client service token", () => {
  afterEach(() => vi.unstubAllEnvs());

  async function headersSentOnWrite(): Promise<Headers> {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await patchDismiss("alert-1").catch(() => {
      // the body doesn't match the schema; only the headers matter here
    });
    return new Headers((fetchMock.mock.calls[0][1] as RequestInit).headers);
  }

  it("sends OPERATOR_SERVICE_TOKEN on a write when it is set", async () => {
    vi.stubEnv("OPERATOR_SERVICE_TOKEN", "s3cret");

    expect((await headersSentOnWrite()).get("x-operator-token")).toBe("s3cret");
  });

  it("sends no token header when it isn't set", async () => {
    vi.stubEnv("OPERATOR_SERVICE_TOKEN", "");

    expect((await headersSentOnWrite()).has("x-operator-token")).toBe(false);
  });
});

describe("operator-client read timeout", () => {
  it("bounds a read with an abort signal, so a hung upstream can't stall the page", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ store: {} }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchStore("store-1").catch(() => {
      // schema shape isn't the point; only that the read carries a deadline
    });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

/**
 * A write the API answered with a 2xx may already have applied upstream. If the
 * body can't be read, the BFF must not treat that like an outage and replay the
 * write against the seed, so the client names it as its own error.
 */
describe("operator-client unreadable write responses", () => {
  it("throws OperatorContractError when a 2xx body doesn't match the schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ unexpected: true }), { status: 200 })),
    );

    await expect(patchDismiss("alert-1")).rejects.toBeInstanceOf(OperatorContractError);
  });

  it("throws OperatorContractError when a 2xx body isn't JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>", { status: 200 })));

    await expect(patchDismiss("alert-1")).rejects.toBeInstanceOf(OperatorContractError);
  });
});
