import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { resetOperatorWriteState } from "@/test/handlers/operator";
import { API_URL } from "@/lib/apiUrl";
import { GET, POST } from "./route";

const ctx = (storeId: string) => ({ params: Promise.resolve({ storeId }) });
const request = (method: "GET" | "POST") =>
  new NextRequest("http://localhost:3000/api/operator/stores/x/restock-sessions", { method });

/** What the BFF actually sent to portfolio_api, captured off the MSW server. */
type Sent = { method: string; url: string; token: string | null };
let sent: Sent[] = [];

/** The id of a store the MSW handlers serve, asked the way the BFF asks. */
async function aKnownStoreId(): Promise<string> {
  const { stores } = await (await fetch(`${API_URL}/api/operator/stores`)).json();
  return stores[0].id;
}

beforeEach(() => {
  sent = [];
  resetOperatorWriteState();
  vi.stubEnv("OPERATOR_SERVICE_TOKEN", "service-token");
  server.events.on("request:start", ({ request: incoming }) => {
    sent.push({
      method: incoming.method,
      url: incoming.url,
      token: incoming.headers.get("x-operator-token"),
    });
  });
  // A fall back to the seed would let these pass against fixtures, not the API.
  vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
    throw new Error(`Fell back to the seed during a route test: ${args.map(String).join(" ")}`);
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  server.events.removeAllListeners();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/** Calls to the restock-sessions endpoint, not the lookup the test itself made. */
const sessionCalls = () => sent.filter((call) => call.url.includes("/restock-sessions"));

describe("POST /api/operator/stores/:storeId/restock-sessions", () => {
  it("opens a session upstream for the store and answers 201 with it", async () => {
    const storeId = await aKnownStoreId();
    sent = [];

    const res = await POST(request("POST"), ctx(storeId));

    expect(res.status).toBe(201);
    const { session } = await res.json();
    expect(session).toMatchObject({ storeId, completedAt: null });
    expect(sessionCalls()).toEqual([
      {
        method: "POST",
        url: `${API_URL}/api/operator/stores/${storeId}/restock-sessions`,
        token: "service-token",
      },
    ]);
  });

  it("answers 404 for a store the API does not know", async () => {
    const res = await POST(request("POST"), ctx("no-such-store"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Store not found" });
  });

  it("explains a rejected service token instead of pretending the write worked", async () => {
    server.use(
      http.post(`${API_URL}/api/operator/stores/:id/restock-sessions`, () =>
        HttpResponse.json({ error: "bad token" }, { status: 401 }),
      ),
    );

    const res = await POST(request("POST"), ctx("store-001"));

    expect(res.status).toBe(503);
    expect(res.headers.get("x-operator-config")).toBe("token-mismatch");
    expect((await res.json()).error).toContain("OPERATOR_SERVICE_TOKEN");
  });

  it("hands a 4xx from the API back to the caller as is, and turns a 5xx into a 502", async () => {
    server.use(
      http.post(`${API_URL}/api/operator/stores/:id/restock-sessions`, () =>
        HttpResponse.json({ error: "slow down" }, { status: 429 }),
      ),
    );
    const limited = await POST(request("POST"), ctx("store-001"));
    expect(limited.status).toBe(429);

    server.use(
      http.post(`${API_URL}/api/operator/stores/:id/restock-sessions`, () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
    );
    const broken = await POST(request("POST"), ctx("store-001"));
    expect(broken.status).toBe(502);
  });

  it("answers 502 and warns the page to reload when the API accepts the write but replies with junk", async () => {
    server.use(
      http.post(`${API_URL}/api/operator/stores/:id/restock-sessions`, () =>
        HttpResponse.json({ unexpected: true }, { status: 201 }),
      ),
    );

    const res = await POST(request("POST"), ctx("store-001"));

    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain("reload");
  });

  it("never sends a path-climbing store id upstream", async () => {
    // The BFF treats the rejected id as an outage and falls back to the seed,
    // which is expected here, so the guard against that is lifted for this test.
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await POST(request("POST"), ctx("../secret"));

    expect(sessionCalls()).toEqual([]);
  });

  // Known bug: writeWithFallback catches InvalidSegmentError along with real
  // outages, so withOperatorErrors never gets to answer 400 for it. The caller
  // gets the seed's 404 "Store not found" for a malformed id instead.
  it.fails("answers 400 Invalid identifier for a path-climbing store id", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const res = await POST(request("POST"), ctx("../secret"));

    expect(res.status).toBe(400);
  });
});

describe("GET /api/operator/stores/:storeId/restock-sessions", () => {
  it("lists the store's sessions from the API, which is empty before any is opened", async () => {
    const storeId = await aKnownStoreId();

    const res = await GET(request("GET"), ctx(storeId));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sessions: [] });
  });

  it("includes a session once it has been opened for that store", async () => {
    const storeId = await aKnownStoreId();
    const opened = await (await POST(request("POST"), ctx(storeId))).json();

    const { sessions } = await (await GET(request("GET"), ctx(storeId))).json();

    expect(sessions.map((s: { id: string }) => s.id)).toEqual([opened.session.id]);
  });

  it("asks upstream for that store's sessions with the service token", async () => {
    sent = [];

    await GET(request("GET"), ctx("store-001"));

    expect(sessionCalls()).toEqual([
      {
        method: "GET",
        url: `${API_URL}/api/operator/stores/store-001/restock-sessions`,
        token: "service-token",
      },
    ]);
  });
});
