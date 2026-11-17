import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const createTokenRequest = vi.fn(async (params: unknown) => ({ signed: params }));

vi.mock("ably", () => ({
  Rest: class {
    auth = { createTokenRequest };
  },
}));

import { POST } from "./route";

const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/mind-reader/token", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/mind-reader/token", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    createTokenRequest.mockClear();
  });

  it("mints a token that only reaches the one room asked for", async () => {
    vi.stubEnv("ABLY_KEY", "app.key:secret");
    const res = await post({ clientId: "peer_1", room: "K7QX3" });
    expect(res.status).toBe(200);
    expect(createTokenRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "peer_1",
        capability: { "mind-reader:K7QX3": ["publish", "subscribe"] },
      }),
    );
  });

  it("says rooms are off, rather than failing, when no key is configured", async () => {
    vi.stubEnv("ABLY_KEY", "");
    const res = await post({ clientId: "peer_1", room: "K7QX3" });
    expect(res.status).toBe(503);
    expect(createTokenRequest).not.toHaveBeenCalled();
  });

  it("refuses a room code that could widen the channel scope", async () => {
    vi.stubEnv("ABLY_KEY", "app.key:secret");
    for (const room of ["*", "K7QX3*", "presence:world-toronto", "", 42]) {
      const res = await post({ clientId: "peer_1", room });
      expect(res.status).toBe(400);
    }
    expect(createTokenRequest).not.toHaveBeenCalled();
  });

  it("refuses a malformed client id", async () => {
    vi.stubEnv("ABLY_KEY", "app.key:secret");
    const res = await post({ clientId: "not ok!", room: "K7QX3" });
    expect(res.status).toBe(400);
  });
});
