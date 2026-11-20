import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/upstream", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

import { NextRequest } from "next/server";
import { fetchUpstream } from "@/lib/upstream";
import { GET } from "./route";

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("GET /api/nba/freeagents", () => {
  it("defaults to the current season rather than a year written into the code", async () => {
    vi.useFakeTimers({ now: new Date(2026, 10, 19), toFake: ["Date"] });
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: Response.json({ players: [] }),
    } as Awaited<ReturnType<typeof fetchUpstream>>);

    await GET(new NextRequest("http://localhost:3000/api/nba/freeagents"));

    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toContain("/seasons/2027/");
  });
});
