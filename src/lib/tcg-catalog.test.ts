import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchCatalog } from "./tcg-catalog";

const CATALOG = {
  updatedAt: "2026-07-01T00:00:00.000Z",
  series: [
    {
      id: "A",
      name: "Genetic Apex",
      logo: null,
      sets: [
        { id: "A1", name: "Genetic Apex", logo: null, symbol: null, cardCountOfficial: 286, cardCountTotal: 286 },
        { id: "A9", name: "Announced", logo: null, symbol: null, cardCountOfficial: null, cardCountTotal: null },
      ],
    },
  ],
};

const stubResponse = (status: number, body: unknown) =>
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/**
 * A fetch that never answers until its signal gives up, which is what the API
 * looked like while a crashed deploy sat behind Railway's edge.
 */
function stalledFetch() {
  return vi.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        const fail = () => reject(Object.assign(new Error("timed out"), { name: "TimeoutError" }));
        if (signal?.aborted) fail();
        signal?.addEventListener("abort", fail);
      }),
  );
}

/** Every deadline has already passed, so the test doesn't wait for a real one. */
function expireDeadlines() {
  return vi
    .spyOn(AbortSignal, "timeout")
    .mockImplementation(() => AbortSignal.abort(new DOMException("timed out", "TimeoutError")));
}

describe("fetchCatalog", () => {
  it("gives up on a stalled API and reports the catalog as unreadable", { timeout: 1000 }, async () => {
    vi.stubGlobal("fetch", stalledFetch());
    const deadline = expireDeadlines();

    await expect(fetchCatalog()).resolves.toBeNull();
    expect(deadline).toHaveBeenCalledWith(8_000);
  });

  it("returns the catalog the API serves, keeping a set whose counts aren't known yet as null", async () => {
    stubResponse(200, CATALOG);

    const catalog = await fetchCatalog();

    expect(catalog?.series[0].sets.map((set) => set.cardCountTotal)).toEqual([286, null]);
  });

  it("tells an empty catalog apart from an unreadable one", async () => {
    stubResponse(200, { series: [], updatedAt: null });

    expect(await fetchCatalog()).toEqual({ series: [], updatedAt: null });
  });

  it("reports the catalog as unreadable on an error status, even with a good body", async () => {
    stubResponse(503, CATALOG);

    expect(await fetchCatalog()).toBeNull();
  });

  it("reports the catalog as unreadable when the API is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    expect(await fetchCatalog()).toBeNull();
  });

  it("reports the catalog as unreadable when the body doesn't match the schema", async () => {
    stubResponse(200, { series: "nope" });

    expect(await fetchCatalog()).toBeNull();
  });

  it("asks for a fresh catalog every time", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(CATALOG)));
    vi.stubGlobal("fetch", fetchMock);

    await fetchCatalog();

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
  });
});
