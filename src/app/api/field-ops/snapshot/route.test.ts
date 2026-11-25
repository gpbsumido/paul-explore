import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { API_URL } from "@/lib/apiUrl";
import { GET } from "./route";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("GET /api/field-ops/snapshot", () => {
  it("passes portfolio_api's snapshot through, never cached", async () => {
    const fetchSpy = vi.fn(
      async () => new Response(JSON.stringify({ tracks: [], alerts: [] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const response = await GET();

    expect(fetchSpy.mock.calls[0][0]).toBe(`${API_URL}/api/field-ops/snapshot`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ tracks: [], alerts: [] });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("answers 502 with a fixed message when the backend is down, without leaking its address", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("connect ECONNREFUSED 10.0.0.5:3001");
    });

    const response = await GET();

    expect(response.status).toBe(502);
    const body = await response.text();
    expect(JSON.parse(body)).toEqual({ error: "Backend unavailable" });
    expect(body).not.toContain("10.0.0.5");
  });
});
