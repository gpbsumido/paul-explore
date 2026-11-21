import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { resetOperatorWriteState } from "@/test/handlers/operator";
import { API_URL } from "@/lib/apiUrl";
import { POST as openSession } from "../../../stores/[storeId]/restock-sessions/route";
import { POST } from "./route";

const ctx = (sessionId: string) => ({ params: Promise.resolve({ sessionId }) });
const completeRequest = (body: unknown) =>
  new NextRequest("http://localhost:3000/api/operator/restock-sessions/s/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

/** What the BFF actually sent to portfolio_api, captured off the MSW server. */
type Sent = { method: string; url: string; token: string | null; body: Promise<string> };
let sent: Sent[] = [];
const completeCalls = () => sent.filter((call) => call.url.endsWith("/complete"));

/** Opens a session on a store the MSW handlers serve and returns its id. */
async function anOpenSessionId(): Promise<string> {
  const { stores } = await (await fetch(`${API_URL}/api/operator/stores`)).json();
  const res = await openSession(
    new NextRequest("http://localhost:3000/x", { method: "POST" }),
    { params: Promise.resolve({ storeId: stores[0].id }) },
  );
  return (await res.json()).session.id;
}

beforeEach(() => {
  sent = [];
  resetOperatorWriteState();
  vi.stubEnv("OPERATOR_SERVICE_TOKEN", "service-token");
  server.events.on("request:start", ({ request }) => {
    const copy = request.clone();
    sent.push({
      method: request.method,
      url: request.url,
      token: request.headers.get("x-operator-token"),
      body: copy.text(),
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

describe("POST /api/operator/restock-sessions/:sessionId/complete", () => {
  it("refuses a body without notes, or with the wrong type, and never calls the API", async () => {
    const missing = await POST(completeRequest({}), ctx("session-001"));
    const wrongType = await POST(completeRequest({ notes: 7 }), ctx("session-001"));
    const tooLong = await POST(completeRequest({ notes: "x".repeat(2001) }), ctx("session-001"));
    const notJson = await POST(completeRequest("{nope"), ctx("session-001"));

    expect([missing.status, wrongType.status, tooLong.status, notJson.status]).toEqual([400, 400, 400, 400]);
    expect(completeCalls()).toEqual([]);
  });

  it("completes the session upstream with the notes and the service token", async () => {
    const sessionId = await anOpenSessionId();
    sent = [];

    await POST(completeRequest({ notes: "counted twice" }), ctx(sessionId));

    expect(completeCalls()).toHaveLength(1);
    const [call] = completeCalls();
    expect(call.method).toBe("POST");
    expect(call.url).toBe(`${API_URL}/api/operator/restock-sessions/${sessionId}/complete`);
    expect(call.token).toBe("service-token");
    expect(JSON.parse(await call.body)).toEqual({ notes: "counted twice" });
  });

  it("answers 200 with the completed session, its lines, the changed items and the activity entry", async () => {
    const sessionId = await anOpenSessionId();

    const res = await POST(completeRequest({ notes: null }), ctx(sessionId));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.session).toMatchObject({ id: sessionId, notes: null });
    expect(body.session.completedAt).not.toBeNull();
    expect(body).toHaveProperty("lines");
    expect(body).toHaveProperty("items");
    expect(body.activity.type).toBe("restock");
  });

  it("answers 404 for a session the API has never seen", async () => {
    const res = await POST(completeRequest({ notes: null }), ctx("session-999"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Restock session not found" });
  });

  it("hands the API's 409 back when the session was already completed", async () => {
    const sessionId = await anOpenSessionId();
    await POST(completeRequest({ notes: null }), ctx(sessionId));

    const again = await POST(completeRequest({ notes: null }), ctx(sessionId));

    expect(again.status).toBe(409);
  });

  it("explains a rejected service token instead of pretending the write worked", async () => {
    server.use(
      http.post(`${API_URL}/api/operator/restock-sessions/:id/complete`, () =>
        HttpResponse.json({ error: "bad token" }, { status: 403 }),
      ),
    );

    const res = await POST(completeRequest({ notes: null }), ctx("session-001"));

    expect(res.status).toBe(503);
    expect(res.headers.get("x-operator-config")).toBe("token-mismatch");
  });

  it("turns an API failure into a 502", async () => {
    server.use(
      http.post(`${API_URL}/api/operator/restock-sessions/:id/complete`, () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
    );

    const res = await POST(completeRequest({ notes: null }), ctx("session-001"));

    expect(res.status).toBe(502);
  });

  it("warns the page to reload when the API accepts the write but answers with junk", async () => {
    server.use(
      http.post(`${API_URL}/api/operator/restock-sessions/:id/complete`, () =>
        HttpResponse.json({ unexpected: true }),
      ),
    );

    const res = await POST(completeRequest({ notes: null }), ctx("session-001"));

    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain("reload");
  });

  it("never sends a path-climbing session id upstream", async () => {
    // The BFF treats a rejected id as an outage and falls back to the seed.
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await POST(completeRequest({ notes: null }), ctx("../secret"));

    expect(completeCalls()).toEqual([]);
  });

  it("answers 400 Invalid identifier for a path-climbing session id", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const res = await POST(completeRequest({ notes: null }), ctx("../secret"));

    expect(res.status).toBe(400);
  });
});
