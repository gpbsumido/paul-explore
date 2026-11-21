import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn(), getSession: vi.fn() },
}));

import { auth0 } from "@/lib/auth0";

type Session = Awaited<ReturnType<typeof auth0.getSession>>;

const fetchMock = vi.fn();

const request = (path: string, init?: { method: string; body?: unknown }) =>
  new NextRequest(`http://localhost${path}`, {
    method: init?.method,
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });

/** The headers and body of the call the route made upstream. */
const upstreamCall = () => {
  const [url, init] = fetchMock.mock.calls[0];
  return {
    url: String(url),
    method: init?.method ?? "GET",
    headers: init?.headers as Record<string, string>,
    body: init?.body as string | undefined,
  };
};

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "user-token",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
    // The mock only has to carry what the routes read.
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  fetchMock.mockReset();
});

describe("calendar BFF routes", () => {
  it("lists calendars with the signed-in user's token", async () => {
    fetchMock.mockResolvedValue(Response.json({ calendars: [{ id: "c1" }] }));
    const { GET } = await import("./calendar/calendars/route");

    const res = await GET(request("/api/calendar/calendars"), undefined);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ calendars: [{ id: "c1" }] });
    expect(upstreamCall().headers).toEqual({ Authorization: "Bearer user-token" });
    expect(upstreamCall().url).toMatch(/\/api\/calendar\/calendars$/);
  });

  it("answers 401 without calling the API when nobody is signed in", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));
    const { GET } = await import("./calendar/calendars/route");

    const res = await GET(request("/api/calendar/calendars"), undefined);

    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("hides the backend's error detail but keeps its status when listing fails", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: "stack trace here" }, { status: 503 }));
    const { GET } = await import("./calendar/calendars/route");

    const res = await GET(request("/api/calendar/calendars"), undefined);

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Failed to fetch calendars" });
  });

  it("creates a calendar, forwarding only the fields it knows about, and answers 201", async () => {
    fetchMock.mockResolvedValue(Response.json({ calendar: { id: "c9" } }));
    const { POST } = await import("./calendar/calendars/route");

    const res = await POST(
      request("/api/calendar/calendars", {
        method: "POST",
        body: { name: "Shifts", color: "#3b82f6", syncMode: "none", isAdmin: true },
      }),
      undefined,
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ calendar: { id: "c9" } });
    const call = upstreamCall();
    expect(call.method).toBe("POST");
    expect(call.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(call.body ?? "")).toEqual({ name: "Shifts", color: "#3b82f6", syncMode: "none" });
  });

  it("refuses a calendar with no name before it reaches the API", async () => {
    const { POST } = await import("./calendar/calendars/route");

    const res = await POST(
      request("/api/calendar/calendars", {
        method: "POST",
        body: { name: "", color: "#3b82f6", syncMode: "none" },
      }),
      undefined,
    );

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes the API's own refusal of a new calendar straight through", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: "Calendar limit reached" }, { status: 409 }));
    const { POST } = await import("./calendar/calendars/route");

    const res = await POST(
      request("/api/calendar/calendars", {
        method: "POST",
        body: { name: "Shifts", color: "#3b82f6", syncMode: "none" },
      }),
      undefined,
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Calendar limit reached" });
  });

  it("forwards only the event filters that were asked for", async () => {
    fetchMock.mockResolvedValue(Response.json({ events: [] }));
    const { GET } = await import("./calendar/events/route");

    await GET(
      request("/api/calendar/events?start=2026-11-01&end=&cardName=Pikachu&other=1"),
      undefined,
    );

    const { searchParams } = new URL(upstreamCall().url);
    expect(Object.fromEntries(searchParams)).toEqual({ start: "2026-11-01", cardName: "Pikachu" });
  });

  it("creates an event and answers 201, refusing one with no title", async () => {
    fetchMock.mockResolvedValue(Response.json({ event: { id: "e1" } }));
    const { POST } = await import("./calendar/events/route");
    const event = {
      title: "League night",
      startDate: "2026-11-20T18:00:00Z",
      endDate: "2026-11-20T19:00:00Z",
      color: "#2563eb",
      allDay: false,
    };

    const created = await POST(request("/api/calendar/events", { method: "POST", body: event }), undefined);
    const refused = await POST(
      request("/api/calendar/events", { method: "POST", body: { ...event, title: "" } }),
      undefined,
    );

    expect(created.status).toBe(201);
    expect(JSON.parse(upstreamCall().body ?? "")).toEqual(event);
    expect(refused.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

describe("GET /api/google/auth/status", () => {
  it("reports whether Google is connected", async () => {
    fetchMock.mockResolvedValue(Response.json({ connected: true }));
    const { GET } = await import("./google/auth/status/route");

    const res = await GET(request("/api/google/auth/status"), undefined);

    expect(await res.json()).toEqual({ connected: true });
    expect(upstreamCall().headers).toEqual({ Authorization: "Bearer user-token" });
  });

  it("keeps a 401 from the API as a 401, so the client reads 'not connected', not 'unavailable'", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 401 }));
    const { GET } = await import("./google/auth/status/route");

    const res = await GET(request("/api/google/auth/status"), undefined);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Failed to fetch status" });
  });

  it("answers 502 when the API can't be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const { GET } = await import("./google/auth/status/route");

    const res = await GET(request("/api/google/auth/status"), undefined);

    expect(res.status).toBe(502);
  });
});

describe("POST /api/zeroproof/wallets", () => {
  it("forwards the body as JSON with its content type, or the backend reads every field as missing", async () => {
    fetchMock.mockResolvedValue(Response.json({ wallet: { id: "w1" } }));
    const { POST } = await import("./zeroproof/wallets/route");

    const res = await POST(
      request("/api/zeroproof/wallets", { method: "POST", body: { mode: "challenge", depositCents: 5000 } }),
      undefined,
    );

    expect(await res.json()).toEqual({ wallet: { id: "w1" } });
    const call = upstreamCall();
    expect(call.headers).toEqual({ Authorization: "Bearer user-token", "Content-Type": "application/json" });
    expect(JSON.parse(call.body ?? "")).toEqual({ mode: "challenge", depositCents: 5000 });
  });

  it("sends an empty object, not a crash, when the body isn't JSON", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: "mode is required" }, { status: 400 }));
    const { POST } = await import("./zeroproof/wallets/route");

    const res = await POST(
      new NextRequest("http://localhost/api/zeroproof/wallets", { method: "POST", body: "oops" }),
      undefined,
    );

    expect(upstreamCall().body).toBe("{}");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "mode is required" });
  });

  it("falls back to a plain message when the API's refusal has no readable body", async () => {
    fetchMock.mockResolvedValue(new Response("<html>bad gateway</html>", { status: 500 }));
    const { POST } = await import("./zeroproof/wallets/route");

    const res = await POST(request("/api/zeroproof/wallets", { method: "POST", body: { mode: "season" } }), undefined);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to open wallet" });
  });
});

describe("POST /api/todos/:id/revert", () => {
  const admin = {
    user: { sub: "auth0|1", email: "admin@example.com", email_verified: true },
    // Only the user is read by the gate.
  } as Session;
  const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

  beforeEach(() => {
    vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "admin@example.com");
    vi.mocked(auth0.getSession).mockResolvedValue(admin);
  });

  it("restores the revision asked for on the todo named in the path", async () => {
    fetchMock.mockResolvedValue(Response.json({ todo: { id: "t1", revision: 4 } }));
    const { POST } = await import("./todos/[id]/revert/route");

    const res = await POST(request("/api/todos/t1/revert", { method: "POST", body: { revision: 2 } }), ctx("t1"));

    expect(await res.json()).toEqual({ todo: { id: "t1", revision: 4 } });
    const call = upstreamCall();
    expect(call.url).toMatch(/\/api\/todos\/t1\/revert$/);
    expect(JSON.parse(call.body ?? "")).toEqual({ revision: 2 });
  });

  it.each([
    ["zero", 0],
    ["negative", -1],
    ["fractional", 1.5],
    ["a string", "2"],
  ])("refuses a revision that is %s", async (_name, revision) => {
    const { POST } = await import("./todos/[id]/revert/route");

    const res = await POST(request("/api/todos/t1/revert", { method: "POST", body: { revision } }), ctx("t1"));

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses an id that climbs out of the path, with the caller's token still unspent", async () => {
    const { POST } = await import("./todos/[id]/revert/route");

    const res = await POST(request("/api/todos/x/revert", { method: "POST", body: { revision: 2 } }), ctx(".."));

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the API's status but not its detail when the revert fails", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: "internal detail" }, { status: 404 }));
    const { POST } = await import("./todos/[id]/revert/route");

    const res = await POST(request("/api/todos/t1/revert", { method: "POST", body: { revision: 2 } }), ctx("t1"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Failed to revert" });
  });
});
