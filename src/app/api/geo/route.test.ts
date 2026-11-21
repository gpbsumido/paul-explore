import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { API_URL } from "@/lib/apiUrl";
import { GET } from "./route";

function requestFrom(forwardedFor: string): NextRequest {
  return new NextRequest("http://localhost/api/geo", {
    headers: { "x-forwarded-for": forwardedFor },
  });
}

/** Replaces fetch with one call that answers with `response` (or throws it). */
function stubFetch(answer: Response | Error) {
  const fetchSpy = vi.fn(async () => {
    if (answer instanceof Error) throw answer;
    return answer;
  });
  vi.stubGlobal("fetch", fetchSpy);
  return fetchSpy;
}

beforeEach(() => {
  // the route logs every upstream failure; keep the test output quiet
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("GET /api/geo", () => {
  it("asks portfolio_api about the visitor, not about the Next.js server", async () => {
    const fetchSpy = stubFetch(
      new Response(JSON.stringify({ city: "Toronto" }), { status: 200 }),
    );

    await GET(requestFrom("203.0.113.9, 198.51.100.4"));

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${API_URL}/api/geo`);
    // the rightmost hop is the one the nearest trusted proxy actually saw
    expect(init.headers).toMatchObject({
      "X-Forwarded-For": "198.51.100.4",
      Accept: "application/json",
    });
  });

  it("returns the lookup, cached privately so a CDN does not share it between visitors", async () => {
    stubFetch(new Response(JSON.stringify({ city: "Toronto" }), { status: 200 }));

    const res = await GET(requestFrom("198.51.100.4"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ city: "Toronto" });
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=300");
  });

  it("answers 502 with a fixed message when the backend is down, without leaking its address", async () => {
    stubFetch(new TypeError("connect ECONNREFUSED 10.0.0.5:3001"));

    const res = await GET(requestFrom("198.51.100.4"));

    expect(res.status).toBe(502);
    const body = await res.text();
    expect(JSON.parse(body)).toEqual({ error: "Backend unavailable" });
    expect(body).not.toContain("10.0.0.5");
  });

  it("answers 502 with the same fixed message when the backend replies with an error", async () => {
    stubFetch(new Response("internal host db-7 exploded", { status: 500 }));

    const res = await GET(requestFrom("198.51.100.4"));

    expect(res.status).toBe(502);
    const body = await res.text();
    expect(JSON.parse(body)).toEqual({ error: "Backend unavailable" });
    expect(body).not.toContain("db-7");
  });
});
