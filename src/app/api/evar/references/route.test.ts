import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/upstream", async () => {
  const actual = await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

import { fetchUpstream } from "@/lib/upstream";
import { API_URL } from "@/lib/backendFetch";
import { GET } from "./route";

const upstream = (status: number, body: unknown) =>
  ({
    ok: true as const,
    response: new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

beforeEach(() => vi.clearAllMocks());

describe("evar references proxy", () => {
  it("forwards to the public endpoint without a token", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream(200, { references: [] }));
    const res = await GET();
    expect(await res.json()).toEqual({ references: [] });
    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/evar/references`);
    expect(new Headers(init?.headers).get("authorization")).toBeNull();
  });

  it("keeps the upstream status", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream(500, { error: "boom" }));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
