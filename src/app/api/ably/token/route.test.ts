import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { PRESENCE_ROOM } from "@/lib/world/presence";

const ably = vi.hoisted(() => ({
  createTokenRequest: vi.fn(),
  constructedWith: [] as unknown[],
}));

vi.mock("ably", () => ({
  Rest: class {
    auth = { createTokenRequest: ably.createTokenRequest };
    constructor(options: unknown) {
      ably.constructedWith.push(options);
    }
  },
}));

import { POST } from "./route";

const post = (body: unknown) =>
  new NextRequest("http://localhost/api/ably/token", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

beforeEach(() => {
  vi.stubEnv("ABLY_KEY", "app.key:secret");
  ably.createTokenRequest.mockResolvedValue({ keyName: "app.key", mac: "signed" });
  ably.constructedWith.length = 0;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("POST /api/ably/token", () => {
  it("answers 503 and never touches Ably when no key is configured", async () => {
    vi.stubEnv("ABLY_KEY", "");

    const res = await POST(post({ clientId: "peer-1" }));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Presence not configured" });
    expect(ably.createTokenRequest).not.toHaveBeenCalled();
  });

  it("rejects a body that isn't JSON", async () => {
    const res = await POST(post("not json"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid body" });
  });

  it.each([
    ["missing", {}],
    ["not a string", { clientId: 42 }],
    ["empty", { clientId: "" }],
    ["containing a space", { clientId: "peer 1" }],
    ["trying to climb a path", { clientId: "../peer" }],
    ["longer than 64 characters", { clientId: "a".repeat(65) }],
  ])("rejects a clientId that is %s", async (_name, body) => {
    const res = await POST(post(body));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid clientId" });
    expect(ably.createTokenRequest).not.toHaveBeenCalled();
  });

  it("accepts a clientId of exactly 64 allowed characters", async () => {
    const clientId = `${"a".repeat(60)}_-9Z`;

    const res = await POST(post({ clientId }));

    expect(res.status).toBe(200);
  });

  it("mints an hour-long token scoped to the presence room for that client, from the server's key", async () => {
    const res = await POST(post({ clientId: "peer-1" }));

    expect(res.status).toBe(200);
    expect(ably.constructedWith).toEqual([{ key: "app.key:secret" }]);
    expect(ably.createTokenRequest).toHaveBeenCalledExactlyOnceWith({
      clientId: "peer-1",
      capability: { [`presence:${PRESENCE_ROOM}`]: ["publish", "subscribe", "presence"] },
      ttl: 60 * 60 * 1000,
    });
    const body = await res.json();
    expect(body).toEqual({ keyName: "app.key", mac: "signed" });
    // The secret half of the key never goes to the browser.
    expect(JSON.stringify(body)).not.toContain("secret");
  });

  it("answers 502 when Ably refuses to mint a token", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    ably.createTokenRequest.mockRejectedValue(new Error("ably down"));

    const res = await POST(post({ clientId: "peer-1" }));

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Presence unavailable" });
  });
});
