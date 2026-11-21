import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const sdk = vi.hoisted(() => ({ cardGet: vi.fn() }));

vi.mock("@tcgdex/sdk", () => {
  class TCGdex {
    card = { get: sdk.cardGet };
  }
  return { default: TCGdex };
});

import { TCG_CACHE_CONTROL } from "@/lib/tcg-route";
import { GET } from "./route";

const call = (cardId: string) =>
  GET(new NextRequest("http://localhost/api/tcg/cards/x"), {
    params: Promise.resolve({ cardId }),
  });

beforeEach(() => vi.clearAllMocks());

describe("GET /api/tcg/cards/[cardId]", () => {
  it("looks the card up by the id in the URL", async () => {
    sdk.cardGet.mockResolvedValue({ id: "base1-4", name: "Charizard" });

    await call("base1-4");

    expect(sdk.cardGet).toHaveBeenCalledWith("base1-4");
  });

  it("returns the card with the shared TCG cache header", async () => {
    sdk.cardGet.mockResolvedValue({ id: "base1-4", name: "Charizard" });

    const res = await call("base1-4");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "base1-4", name: "Charizard" });
    expect(res.headers.get("Cache-Control")).toBe(TCG_CACHE_CONTROL);
  });

  it("strips the SDK back-references so the card serialises", async () => {
    // The SDK hangs itself off every model; JSON.stringify would loop on it.
    const card: Record<string, unknown> = { id: "base1-4", name: "Charizard" };
    card.sdk = card;
    card.tcgdex = card;
    sdk.cardGet.mockResolvedValue(card);

    const res = await call("base1-4");

    expect(await res.json()).toEqual({ id: "base1-4", name: "Charizard" });
  });

  it("answers 404 when TCGdex has no such card", async () => {
    sdk.cardGet.mockResolvedValue(undefined);

    const res = await call("nope-1");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
  });
});
