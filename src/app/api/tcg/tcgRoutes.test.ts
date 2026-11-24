import { describe, it, expect, beforeEach, vi } from "vitest";

// One shared set of spies the mocked SDK delegates to, so each test can drive
// list/get outcomes without re-mocking the module. vi.hoisted so the spies
// exist when the hoisted vi.mock factory below runs.
const sdk = vi.hoisted(() => ({
  serieList: vi.fn(),
  serieGet: vi.fn(),
  setList: vi.fn(),
  setGet: vi.fn(),
  cardList: vi.fn(),
  /** Every query-builder call the cards route makes, in order. */
  queryCalls: [] as unknown[][],
}));

vi.mock("@tcgdex/sdk", () => {
  class TCGdex {
    serie = { list: sdk.serieList, get: sdk.serieGet };
    set = { list: sdk.setList, get: sdk.setGet };
    card = { list: sdk.cardList };
  }
  const record = (name: string) => (...args: unknown[]) => {
    sdk.queryCalls.push([name, ...args]);
    return chain;
  };
  const chain: Record<string, (...args: unknown[]) => typeof chain> = {
    sort: record("sort"),
    paginate: record("paginate"),
    like: record("like"),
    contains: record("contains"),
    equal: record("equal"),
  };
  return { default: TCGdex, Query: { create: () => chain } };
});

import { GET as seriesGET } from "./series/route";
import { GET as setsGET } from "./sets/route";
import { GET as cardsGET } from "./cards/route";
import { GET as setDetailGET } from "./sets/[setId]/route";
import { NextRequest } from "next/server";

const CACHE = "public, s-maxage=3600, stale-while-revalidate=86400";

beforeEach(() => {
  vi.clearAllMocks();
  sdk.queryCalls.length = 0;
});

describe("TCG list routes", () => {
  it("sets: forwards the SDK list with the shared cache window", async () => {
    sdk.setList.mockResolvedValue([{ id: "base1" }]);
    const res = await setsGET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe(CACHE);
    expect(await res.json()).toEqual([{ id: "base1" }]);
  });

  it("sets: 502 with its label when the SDK throws", async () => {
    sdk.setList.mockRejectedValue(new Error("down"));
    const res = await setsGET();
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Failed to fetch sets" });
  });

  it("sets: 502 with its label when the SDK returns null", async () => {
    sdk.setList.mockResolvedValue(null);
    const res = await setsGET();
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Failed to fetch sets" });
  });

  it("series: fetches each series in full and drops the misses", async () => {
    sdk.serieList.mockResolvedValue([{ id: "base" }, { id: "gym" }]);
    sdk.serieGet.mockImplementation(async (id: string) =>
      id === "base" ? { id: "base", sets: [] } : null,
    );
    const res = await seriesGET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: "base", sets: [] }]);
  });

  it("cards: forwards the list the SDK returns", async () => {
    sdk.cardList.mockResolvedValue([{ id: "base1-1" }]);
    const req = new NextRequest("http://localhost/api/tcg/cards?q=pika&page=2");
    const res = await cardsGET(req);
    expect(res.status).toBe(200);
    expect(sdk.cardList).toHaveBeenCalledOnce();
    expect(await res.json()).toEqual([{ id: "base1-1" }]);
  });

  it("cards: asks for the first page of twenty, in card order, with no filters by default", async () => {
    sdk.cardList.mockResolvedValue([]);
    await cardsGET(new NextRequest("http://localhost/api/tcg/cards"));
    expect(sdk.queryCalls).toEqual([
      ["sort", "localId", "ASC"],
      ["paginate", 1, 20],
    ]);
  });

  it("cards: turns the search, type, set and page into query filters", async () => {
    sdk.cardList.mockResolvedValue([]);
    await cardsGET(
      new NextRequest(
        "http://localhost/api/tcg/cards?q=pika&type=Lightning&setId=base1&page=3",
      ),
    );
    expect(sdk.queryCalls).toEqual([
      ["sort", "localId", "ASC"],
      ["paginate", 3, 20],
      ["like", "name", "pika"],
      ["contains", "types", "Lightning"],
      ["equal", "set.id", "base1"],
    ]);
  });

  it("cards: 502 with its label when the SDK throws", async () => {
    sdk.cardList.mockRejectedValue(new Error("down"));
    const res = await cardsGET(new NextRequest("http://localhost/api/tcg/cards"));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Failed to fetch cards" });
  });

  it("series: 502 with its label when the series list is unavailable", async () => {
    sdk.serieList.mockResolvedValue(null);
    const res = await seriesGET();
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Failed to fetch series" });
  });
});

describe("TCG detail route", () => {
  it("returns the set with the cache window when found", async () => {
    sdk.setGet.mockResolvedValue({ id: "gym1", name: "Gym Heroes" });
    const res = await setDetailGET(new NextRequest("http://localhost/x"), {
      params: Promise.resolve({ setId: "gym1" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe(CACHE);
    expect(await res.json()).toEqual({ id: "gym1", name: "Gym Heroes" });
    expect(sdk.setGet).toHaveBeenCalledWith("gym1");
  });

  it("returns 404 when the set is missing", async () => {
    sdk.setGet.mockResolvedValue(null);
    const res = await setDetailGET(new NextRequest("http://localhost/x"), {
      params: Promise.resolve({ setId: "nope" }),
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
  });
});
