import { describe, it, expect, vi, afterEach } from "vitest";
import { hostServices } from "./services";

afterEach(() => vi.unstubAllGlobals());

const json = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );

describe("hostServices().referrals", () => {
  it("creates a link through the host's referrals client, API URL and all", async () => {
    const fetchMock = vi.fn().mockReturnValue(json(201, { slug: "abc" }));
    vi.stubGlobal("fetch", fetchMock);

    await hostServices().referrals.create({ slug: "abc" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/referrals$/);
    expect(init.method).toBe("POST");
  });

  it("passes an API refusal through as a readable message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(json(409, {})));
    await expect(hostServices().referrals.create({ slug: "taken" })).rejects.toThrow(
      "That slug is already taken.",
    );
  });

  it("passes an unreachable API through as a TypeError, so the remote can tell offline from no", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(hostServices().referrals.stats("abc")).rejects.toBeInstanceOf(TypeError);
  });
});
