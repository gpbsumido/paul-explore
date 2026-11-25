import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { API_URL } from "@/lib/apiUrl";
import { GET } from "./route";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function streamRequest(query = "") {
  return new NextRequest(`http://localhost/api/field-ops/stream${query}`);
}

describe("GET /api/field-ops/stream", () => {
  it("pipes portfolio_api's event stream through unbuffered, keeping the rate", async () => {
    const fetchSpy = vi.fn(
      async () =>
        new Response("retry: 2000\nevent: update\ndata: {}\n\n", {
          headers: { "Content-Type": "text/event-stream" },
        }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const response = await GET(streamRequest("?rate=low"));

    expect(fetchSpy.mock.calls[0][0]).toBe(`${API_URL}/api/field-ops/stream?rate=low`);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toContain("no-transform");
    expect(await response.text()).toContain("event: update");
  });

  it("answers 502 with a fixed message when the backend is down, without leaking its address", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("connect ECONNREFUSED 10.0.0.5:3001");
    });

    const response = await GET(streamRequest());

    expect(response.status).toBe(502);
    const body = await response.text();
    expect(JSON.parse(body)).toEqual({ error: "Backend unavailable" });
    expect(body).not.toContain("10.0.0.5");
  });
});
