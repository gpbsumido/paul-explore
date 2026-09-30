import { afterEach, describe, expect, it, vi } from "vitest";
import { createTransport, type TrackEvent } from "./tracker";

const event: TrackEvent = {
  eventUuid: "11111111-1111-4111-8111-111111111111",
  name: "page_view",
  page: "/zeroproof",
  seq: 1,
  sessionId: "sess-1",
  anonId: "anon-hash",
  clientTs: "2026-09-29T00:00:00.000Z",
  appVersion: "7.9.3",
};

afterEach(() => vi.restoreAllMocks());

describe("createTransport", () => {
  it("beacons a plain string body, never an application/json Blob (a Blob forces a CORS preflight)", () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal("navigator", { sendBeacon });

    const ok = createTransport("/api/zeroproof/track").beacon([event]);

    expect(ok).toBe(true);
    const [url, body] = sendBeacon.mock.calls[0] ?? [];
    expect(url).toBe("/api/zeroproof/track");
    expect(typeof body).toBe("string");
    expect(body).not.toBeInstanceOf(Blob);
    expect(JSON.parse(body as string)).toEqual({ events: [event] });
  });

  it("posts with keepalive and returns the upstream status", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);

    const status = await createTransport("/api/zeroproof/track").send([event]);

    expect(status).toBe(202);
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(init).toMatchObject({ method: "POST", keepalive: true });
  });

  it("maps a network error to status 0 so the queue retries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );

    expect(await createTransport("/api/zeroproof/track").send([event])).toBe(0);
  });
});
