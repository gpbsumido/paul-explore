import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/upstream", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});
vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn(), getAccessToken: vi.fn() },
}));

import { API_URL } from "@/lib/apiUrl";
import { fetchUpstream } from "@/lib/upstream";
import { auth0 } from "@/lib/auth0";
import { DELETE as googleDELETE } from "./calendars/[id]/google/route";
import {
  GET as cardsGET,
  POST as cardsPOST,
} from "./events/[id]/cards/route";

/** A successful upstream answer. */
const upstream = (body: unknown, status = 200) =>
  ({
    ok: true as const,
    response: new Response(JSON.stringify(body), { status }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

const timedOut = {
  ok: false as const,
  cause: "timeout" as const,
  message: "aborted",
};

/** The URL and options of the one upstream call the route made. */
function upstreamCall(): { url: string; init: RequestInit } {
  const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
  return { url: String(url), init: init ?? {} };
}

const eventParams = (id: string) => ({ params: Promise.resolve({ id }) });

function cardsPostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/calendar/events/ev-1/cards", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const plainRequest = () => new NextRequest("http://localhost/x");

beforeEach(() => {
  vi.mocked(auth0.getAccessToken).mockResolvedValue({ token: "tok" } as never);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("DELETE /api/calendar/calendars/[id]/google", () => {
  it("tells the backend to unlink that calendar, as the signed-in user", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ unlinked: true }));

    const res = await googleDELETE(plainRequest(), eventParams("cal-7"));

    const { url, init } = upstreamCall();
    expect(url).toBe(`${API_URL}/api/calendar/calendars/cal-7/google`);
    expect(init.method).toBe("DELETE");
    expect(init.headers).toMatchObject({ Authorization: "Bearer tok" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ unlinked: true });
  });

  it("passes the backend's own error body and status through", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(
      upstream({ error: "Calendar not linked" }, 409),
    );

    const res = await googleDELETE(plainRequest(), eventParams("cal-7"));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Calendar not linked" });
  });

  it("falls back to a fixed message when the backend error is not JSON", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response("<html>bad gateway</html>", { status: 500 }),
    });

    const res = await googleDELETE(plainRequest(), eventParams("cal-7"));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: "Failed to disconnect Google Calendar",
    });
  });

  it("answers 504 when the backend is too slow", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(timedOut);

    const res = await googleDELETE(plainRequest(), eventParams("cal-7"));

    expect(res.status).toBe(504);
  });

  it("answers 401 for a signed-out caller and never reaches the backend", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));

    const res = await googleDELETE(plainRequest(), eventParams("cal-7"));

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("rejects an id that tries to climb out of the path", async () => {
    const res = await googleDELETE(plainRequest(), eventParams("../admin"));

    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });
});

describe("GET /api/calendar/events/[id]/cards", () => {
  it("fetches the cards of that event with the caller's token", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ cards: [{ id: 1 }] }));

    const res = await cardsGET(plainRequest(), eventParams("ev-1"));

    const { url, init } = upstreamCall();
    expect(url).toBe(`${API_URL}/api/calendar/events/ev-1/cards`);
    expect(init.headers).toMatchObject({ Authorization: "Bearer tok" });
    expect(await res.json()).toEqual({ cards: [{ id: 1 }] });
  });

  it("keeps the backend's status but hides its body behind a fixed message", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(
      upstream({ error: "relation cards_7 missing" }, 404),
    );

    const res = await cardsGET(plainRequest(), eventParams("ev-1"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Failed to fetch cards" });
  });

  it("rejects an id that tries to climb out of the path", async () => {
    const res = await cardsGET(plainRequest(), eventParams("a/b"));

    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });
});

describe("POST /api/calendar/events/[id]/cards", () => {
  const card = { cardId: "base1-4", cardName: "Charizard", quantity: 2 };

  it("adds the card upstream and answers 201 with what the backend stored", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ id: 55, ...card }));

    const res = await cardsPOST(cardsPostRequest(card), eventParams("ev-1"));

    const { url, init } = upstreamCall();
    expect(url).toBe(`${API_URL}/api/calendar/events/ev-1/cards`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(card);
    expect(init.headers).toMatchObject({
      Authorization: "Bearer tok",
      "Content-Type": "application/json",
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 55, ...card });
  });

  it.each([
    ["no card id", { cardName: "Charizard" }],
    ["an empty card name", { cardId: "base1-4", cardName: "" }],
    ["a zero quantity", { cardId: "base1-4", cardName: "Charizard", quantity: 0 }],
  ])("rejects %s with a 400 and never calls the backend", async (_name, body) => {
    const res = await cardsPOST(cardsPostRequest(body), eventParams("ev-1"));

    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("passes the backend's own error body and status through", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(
      upstream({ error: "Card already on this event" }, 409),
    );

    const res = await cardsPOST(cardsPostRequest(card), eventParams("ev-1"));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Card already on this event" });
  });
});
