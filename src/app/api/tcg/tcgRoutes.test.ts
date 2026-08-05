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
}));

vi.mock("@tcgdex/sdk", () => {
  class TCGdex {
    serie = { list: sdk.serieList, get: sdk.serieGet };
    set = { list: sdk.setList, get: sdk.setGet };
    card = { list: sdk.cardList };
  }
  const chain: Record<string, () => typeof chain> = {
    sort: () => chain,
    paginate: () => chain,
    like: () => chain,
    contains: () => chain,
    equal: () => chain,
  };
  return { default: TCGdex, Query: { create: () => chain } };
});

import { GET as seriesGET } from "./series/route";
import { GET as setsGET } from "./sets/route";
import { GET as cardsGET } from "./cards/route";
import { GET as setDetailGET } from "./sets/[setId]/route";
import { NextRequest } from "next/server";

const CACHE = "public, s-maxage=3600, stale-while-revalidate=86400";

beforeEach(() => vi.clearAllMocks());

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

  it("cards: passes the built query through and forwards the list", async () => {
    sdk.cardList.mockResolvedValue([{ id: "base1-1" }]);
    const req = new NextRequest("http://localhost/api/tcg/cards?q=pika&page=2");
    const res = await cardsGET(req);
    expect(res.status).toBe(200);
    expect(sdk.cardList).toHaveBeenCalledOnce();
    expect(await res.json()).toEqual([{ id: "base1-1" }]);
  });
});

describe("TCG detail route", () => {
  it("returns the set with the cache window when found", async () => {
    sdk.setGet.mockResolvedValue({ id: "base1", name: "Base" });
    const res = await setDetailGET(new NextRequest("http://localhost/x"), {
      params: Promise.resolve({ setId: "base1" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe(CACHE);
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
